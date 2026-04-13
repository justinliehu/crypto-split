/**
 * 本地存储工具 — 管理群组与账单数据
 */

const GROUPS_KEY = 'cryptosplit_groups';
const EXPENSES_KEY = 'cryptosplit_expenses';
const TX_KEY = 'cryptosplit_transactions';

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── 数据迁移：修复旧数据中 nickname 为"（你）"的问题 ──────────────────────────
(function migrateNicknames() {
  try {
    const groups = JSON.parse(localStorage.getItem(GROUPS_KEY)) || [];
    let changed = false;
    for (const g of groups) {
      for (const m of g.members || []) {
        if (m.nickname === '（你）' || m.nickname === '(you)') {
          m.nickname = '';
          changed = true;
        }
      }
    }
    if (changed) localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {}
})();

// ─── 群组 ─────────────────────────────────────────────────────────────────────

export function getGroups() {
  return read(GROUPS_KEY);
}

export function getGroup(id) {
  return getGroups().find((g) => g.id === id) || null;
}

export function createGroup({ name, members, createdBy }) {
  const groups = getGroups();
  const group = {
    id: crypto.randomUUID(),
    name,
    members, // [{address, nickname}]
    createdBy,
    createdAt: Date.now(),
  };
  groups.push(group);
  write(GROUPS_KEY, groups);
  return group;
}

export function updateGroup(id, updates) {
  const groups = getGroups();
  const idx = groups.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  groups[idx] = { ...groups[idx], ...updates };
  write(GROUPS_KEY, groups);
  return groups[idx];
}

export function deleteGroup(id) {
  write(GROUPS_KEY, getGroups().filter((g) => g.id !== id));
  // 同时删除该群组的所有账单
  write(EXPENSES_KEY, getExpenses().filter((e) => e.groupId !== id));
}

// ─── 账单 ─────────────────────────────────────────────────────────────────────

export function getExpenses(groupId) {
  const all = read(EXPENSES_KEY);
  return groupId ? all.filter((e) => e.groupId === groupId) : all;
}

export function addExpense({ groupId, description, amount, currency, paidBy, splitAmong }) {
  const expenses = read(EXPENSES_KEY);
  const expense = {
    id: crypto.randomUUID(),
    groupId,
    description,
    amount,       // 字符串，如 "0.05"
    currency: currency || 'SOL',
    paidBy,       // 付款人地址
    splitAmong,   // 参与分摊的地址数组
    createdAt: Date.now(),
  };
  expenses.push(expense);
  write(EXPENSES_KEY, expenses);
  return expense;
}

export function deleteExpense(id) {
  write(EXPENSES_KEY, read(EXPENSES_KEY).filter((e) => e.id !== id));
}

/**
 * 合并远程账单到本地（按 ID 去重）
 * 返回新增的数量
 */
export function mergeRemoteExpenses(remoteExpenses) {
  const local = read(EXPENSES_KEY);
  const ids = new Set(local.map((e) => e.id));
  let added = 0;
  for (const e of remoteExpenses) {
    if (e.id && !ids.has(e.id)) {
      local.push(e);
      ids.add(e.id);
      added++;
    }
  }
  if (added > 0) write(EXPENSES_KEY, local);
  return added;
}

// ─── 余额计算（按币种分别计算） ──────────────────────────────────────────────

/**
 * 计算群组内每个成员的净余额（按币种）
 * 返回 { currency: { address: netAmount } }
 */
export function calculateBalances(groupId) {
  const expenses = getExpenses(groupId);
  const byCurrency = {}; // { SOL: { addr: net }, SKR: { addr: net }, ... }

  for (const exp of expenses) {
    const cur = exp.currency || 'SOL';
    if (!byCurrency[cur]) byCurrency[cur] = {};
    const net = byCurrency[cur];

    const share = parseFloat(exp.amount) / exp.splitAmong.length;
    for (const addr of exp.splitAmong) {
      if (addr === exp.paidBy) continue;
      net[exp.paidBy] = (net[exp.paidBy] || 0) + share;
      net[addr] = (net[addr] || 0) - share;
    }
  }

  return byCurrency;
}

/**
 * 简化债务：每种币种分别最少转账次数
 * 返回 [{from, to, amount, currency}]
 */
export function simplifyDebts(groupId) {
  const byCurrency = calculateBalances(groupId);
  const allSettlements = [];

  for (const [currency, net] of Object.entries(byCurrency)) {
    const creditors = [];
    const debtors = [];

    for (const [addr, amount] of Object.entries(net)) {
      if (amount > 0.000001) creditors.push({ addr, amount });
      else if (amount < -0.000001) debtors.push({ addr, amount: -amount });
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const settle = Math.min(creditors[i].amount, debtors[j].amount);
      if (settle > 0.000001) {
        allSettlements.push({
          from: debtors[j].addr,
          to: creditors[i].addr,
          amount: parseFloat(settle.toFixed(8)),
          currency,
        });
      }
      creditors[i].amount -= settle;
      debtors[j].amount -= settle;
      if (creditors[i].amount < 0.000001) i++;
      if (debtors[j].amount < 0.000001) j++;
    }
  }

  return allSettlements;
}

// ─── 交易记录 ─────────────────────────────────────────────────────────────────

export function getTransactions() {
  return read(TX_KEY);
}

export function addTransaction({ from, to, amount, currency, txHash, groupId, groupName }) {
  const transactions = read(TX_KEY);
  const tx = {
    id: crypto.randomUUID(),
    from,
    to,
    amount,
    currency,
    txHash,
    groupId,
    groupName,
    timestamp: Date.now(),
  };
  transactions.push(tx);
  write(TX_KEY, transactions);
  return tx;
}

// ─── 通知：谁欠你钱 ──────────────────────────────────────────────────────────

/**
 * 获取所有群组中别人欠你的债务
 * 返回 [{ groupId, groupName, debts: [{from, amount, currency}] }]
 */
export function getDebtsOwedToYou(walletAddress) {
  const addr = walletAddress.toLowerCase();
  const groups = getGroups();
  const result = [];

  for (const group of groups) {
    if (!group.members.some((m) => m.address?.toLowerCase() === addr)) continue;

    const debts = simplifyDebts(group.id);
    const owedToYou = debts.filter((d) => d.to?.toLowerCase() === addr);

    if (owedToYou.length > 0) {
      result.push({
        groupId: group.id,
        groupName: group.name,
        debts: owedToYou,
      });
    }
  }

  return result;
}

// ─── 云端数据合并 ─────────────────────────────────────────────────────────────

/**
 * 将云端数据合并到本地（以 ID 去重，保留两端数据）
 */
export function mergeCloudData({ groups: cloudGroups, expenses: cloudExpenses, transactions: cloudTx }) {
  // 合并群组
  const localGroups = getGroups();
  const groupIds = new Set(localGroups.map((g) => g.id));
  for (const cg of cloudGroups) {
    if (!groupIds.has(cg.id)) {
      localGroups.push(cg);
    }
  }
  write(GROUPS_KEY, localGroups);

  // 合并账单
  const localExpenses = read(EXPENSES_KEY);
  const expIds = new Set(localExpenses.map((e) => e.id));
  for (const ce of cloudExpenses) {
    if (!expIds.has(ce.id)) {
      localExpenses.push(ce);
    }
  }
  write(EXPENSES_KEY, localExpenses);

  // 合并交易记录
  const localTx = read(TX_KEY);
  const txIds = new Set(localTx.map((t) => t.id));
  for (const ct of cloudTx) {
    if (!txIds.has(ct.id)) {
      localTx.push(ct);
    }
  }
  write(TX_KEY, localTx);
}

/**
 * 本地存储工具 — 管理群组与账单数据
 */

const GROUPS_KEY = 'cryptosplit_groups';
const EXPENSES_KEY = 'cryptosplit_expenses';

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
    currency: currency || 'ETH',
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

// ─── 余额计算 ─────────────────────────────────────────────────────────────────

/**
 * 计算群组内每对成员之间的净余额
 * 返回 Map<string, number>  key = "fromAddr->toAddr", value = 净欠款（正数表示 from 欠 to）
 */
export function calculateBalances(groupId) {
  const expenses = getExpenses(groupId);
  // 先算每对之间的净值
  const net = {}; // { address: netAmount }  正=被欠钱(别人欠你)，负=欠别人

  for (const exp of expenses) {
    const share = parseFloat(exp.amount) / exp.splitAmong.length;
    // 付款人被所有分摊人欠
    for (const addr of exp.splitAmong) {
      if (addr === exp.paidBy) continue;
      net[exp.paidBy] = (net[exp.paidBy] || 0) + share;
      net[addr] = (net[addr] || 0) - share;
    }
  }

  return net;
}

/**
 * 简化债务：最少转账次数
 * 返回 [{from, to, amount}]
 */
export function simplifyDebts(groupId) {
  const net = calculateBalances(groupId);

  const creditors = []; // 被欠钱的人
  const debtors = [];   // 欠钱的人

  for (const [addr, amount] of Object.entries(net)) {
    if (amount > 0.000001) creditors.push({ addr, amount });
    else if (amount < -0.000001) debtors.push({ addr, amount: -amount });
  }

  // 从大到小排序
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements = [];
  let i = 0, j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settle = Math.min(creditors[i].amount, debtors[j].amount);
    if (settle > 0.000001) {
      settlements.push({
        from: debtors[j].addr,
        to: creditors[i].addr,
        amount: parseFloat(settle.toFixed(8)),
      });
    }
    creditors[i].amount -= settle;
    debtors[j].amount -= settle;
    if (creditors[i].amount < 0.000001) i++;
    if (debtors[j].amount < 0.000001) j++;
  }

  return settlements;
}

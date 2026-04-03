/**
 * 云同步工具 — 使用腾讯 CloudBase 实现多设备数据同步
 * 与 overcooked 项目使用相同的 SDK
 */
import cloudbase from '@cloudbase/js-sdk';

let app = null;
let db = null;

const ENV_ID = import.meta.env.VITE_CLOUDBASE_ENV || '';

export function isCloudEnabled() {
  return Boolean(ENV_ID);
}

export async function initCloud() {
  if (!ENV_ID) return null;
  if (app) return db;

  app = cloudbase.init({ env: ENV_ID });
  const auth = app.auth({ persistence: 'local' });

  const loginState = await auth.getLoginState();
  if (!loginState) {
    await auth.anonymousAuthProvider().signIn();
  }

  db = app.database();
  return db;
}

// ─── 群组同步 ─────────────────────────────────────────────────────────────────

/**
 * 上传群组数据到云端
 */
export async function syncGroupToCloud(group) {
  const database = await initCloud();
  if (!database) return;

  const collection = database.collection('split_groups');
  const { data } = await collection.where({ id: group.id }).get();

  if (data.length > 0) {
    await collection.where({ id: group.id }).update(group);
  } else {
    await collection.add(group);
  }
}

/**
 * 从云端获取用户相关的群组
 */
export async function fetchGroupsFromCloud(walletAddress) {
  const database = await initCloud();
  if (!database) return [];

  const addr = walletAddress.toLowerCase();
  const { data } = await database.collection('split_groups').get();

  return data.filter((g) =>
    g.createdBy?.toLowerCase() === addr ||
    g.members?.some((m) => m.address?.toLowerCase() === addr)
  );
}

/**
 * 删除云端群组
 */
export async function deleteGroupFromCloud(groupId) {
  const database = await initCloud();
  if (!database) return;

  await database.collection('split_groups').where({ id: groupId }).remove();
  await database.collection('split_expenses').where({ groupId }).remove();
}

// ─── 账单同步 ─────────────────────────────────────────────────────────────────

export async function syncExpenseToCloud(expense) {
  const database = await initCloud();
  if (!database) return;

  const collection = database.collection('split_expenses');
  const { data } = await collection.where({ id: expense.id }).get();

  if (data.length > 0) {
    await collection.where({ id: expense.id }).update(expense);
  } else {
    await collection.add(expense);
  }
}

export async function fetchExpensesFromCloud(groupId) {
  const database = await initCloud();
  if (!database) return [];

  const { data } = await database.collection('split_expenses')
    .where({ groupId })
    .get();

  return data;
}

export async function deleteExpenseFromCloud(expenseId) {
  const database = await initCloud();
  if (!database) return;

  await database.collection('split_expenses').where({ id: expenseId }).remove();
}

// ─── 交易记录同步 ─────────────────────────────────────────────────────────────

export async function syncTransactionToCloud(tx) {
  const database = await initCloud();
  if (!database) return;

  await database.collection('split_transactions').add(tx);
}

export async function fetchTransactionsFromCloud(walletAddress) {
  const database = await initCloud();
  if (!database) return [];

  const addr = walletAddress.toLowerCase();
  const { data } = await database.collection('split_transactions').get();

  return data.filter((t) =>
    t.from?.toLowerCase() === addr || t.to?.toLowerCase() === addr
  );
}

// ─── 全量同步 ─────────────────────────────────────────────────────────────────

/**
 * 将本地数据全量上传到云端
 */
export async function pushAllToCloud(groups, expenses, transactions) {
  const database = await initCloud();
  if (!database) return;

  for (const g of groups) await syncGroupToCloud(g);
  for (const e of expenses) await syncExpenseToCloud(e);
  for (const t of transactions) await syncTransactionToCloud(t);
}

/**
 * 从云端拉取并合并数据（以云端为准合并）
 * 返回 { groups, expenses, transactions }
 */
export async function pullFromCloud(walletAddress) {
  const database = await initCloud();
  if (!database) return null;

  const groups = await fetchGroupsFromCloud(walletAddress);

  const allExpenses = [];
  for (const g of groups) {
    const expenses = await fetchExpensesFromCloud(g.id);
    allExpenses.push(...expenses);
  }

  const transactions = await fetchTransactionsFromCloud(walletAddress);

  return { groups, expenses: allExpenses, transactions };
}

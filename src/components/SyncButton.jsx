import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useLocale } from '../contexts/LocaleContext';
import { getGroups, getExpenses, getTransactions, mergeCloudData } from '../utils/storage';
import { isCloudEnabled, pushAllToCloud, pullFromCloud } from '../utils/cloudSync';

export default function SyncButton() {
  const { address } = useWallet();
  const { t } = useLocale();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  if (!isCloudEnabled() || !address) return null;

  const handleSync = async () => {
    try {
      setSyncing(true);

      // 1. 上传本地数据
      const groups = getGroups();
      const expenses = getExpenses();
      const transactions = getTransactions();
      await pushAllToCloud(groups, expenses, transactions);

      // 2. 拉取云端数据并合并
      const cloud = await pullFromCloud(address);
      if (cloud) {
        mergeCloudData(cloud);
      }

      setLastSync(new Date());
    } catch (err) {
      console.error('Sync error:', err);
      alert(t('sync_error'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        className="btn btn-ghost btn-sm btn-circle"
        onClick={handleSync}
        disabled={syncing}
        title={t('sync_title')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      {lastSync && (
        <span className="text-xs text-base-content/40">
          {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

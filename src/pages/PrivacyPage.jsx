import { useLocale } from '../contexts/LocaleContext';

export default function PrivacyPage() {
  const { t, locale } = useLocale();

  return (
    <div className="prose prose-sm max-w-none">
      <h1>{t('privacy_title')}</h1>
      {locale === 'zh' ? (
        <>
          <p>最后更新：2026 年 4 月</p>
          <h2>1. 信息收集</h2>
          <p>CryptoSplit 是一款去中心化应用（dApp）。我们不收集、存储或传输您的个人信息到任何服务器。</p>
          <h2>2. 钱包地址</h2>
          <p>您的钱包地址仅用于：</p>
          <ul>
            <li>在应用中标识您的身份</li>
            <li>计算群组成员间的债务关系</li>
            <li>发起链上结算交易</li>
          </ul>
          <p>钱包地址不会被发送到任何第三方服务器。</p>
          <h2>3. 本地存储</h2>
          <p>群组和账单数据存储在您设备的本地存储（localStorage）中。清除浏览器数据将删除所有记录。</p>
          <h2>4. 第三方服务</h2>
          <p>本应用使用 WalletConnect 协议连接钱包，该过程遵循 WalletConnect 的隐私政策。</p>
          <h2>5. 区块链交易</h2>
          <p>通过本应用发起的链上交易是公开的，记录在区块链上，无法删除。</p>
        </>
      ) : (
        <>
          <p>Last updated: April 2026</p>
          <h2>1. Information Collection</h2>
          <p>CryptoSplit is a decentralized application (dApp). We do not collect, store, or transmit your personal information to any server.</p>
          <h2>2. Wallet Address</h2>
          <p>Your wallet address is used only to:</p>
          <ul>
            <li>Identify you within the app</li>
            <li>Calculate debts among group members</li>
            <li>Initiate on-chain settlement transactions</li>
          </ul>
          <p>Your wallet address is not sent to any third-party server.</p>
          <h2>3. Local Storage</h2>
          <p>Group and expense data is stored in your device's localStorage. Clearing browser data will delete all records.</p>
          <h2>4. Third-Party Services</h2>
          <p>This app uses the WalletConnect protocol for wallet connections, subject to WalletConnect's privacy policy.</p>
          <h2>5. Blockchain Transactions</h2>
          <p>On-chain transactions initiated through this app are public and recorded on the blockchain permanently.</p>
        </>
      )}
    </div>
  );
}

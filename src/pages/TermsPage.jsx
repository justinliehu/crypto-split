import { useLocale } from '../contexts/LocaleContext';

export default function TermsPage() {
  const { t, locale } = useLocale();

  return (
    <div className="prose prose-sm max-w-none">
      <h1>{t('terms_title')}</h1>
      {locale === 'zh' ? (
        <>
          <p>最后更新：2026 年 4 月</p>
          <h2>1. 服务说明</h2>
          <p>CryptoSplit 是一款帮助用户使用加密货币分摊费用的工具。本应用不托管任何资金，所有交易由用户自行通过钱包发起。</p>
          <h2>2. 风险提示</h2>
          <ul>
            <li>加密货币价格波动可能影响结算金额的实际价值</li>
            <li>区块链交易不可撤销，请确认收款地址和金额后再发起交易</li>
            <li>本应用不对任何交易错误或损失负责</li>
          </ul>
          <h2>3. 数据</h2>
          <p>所有群组和账单数据存储在您的设备本地，我们无法恢复丢失的数据。</p>
          <h2>4. 免责声明</h2>
          <p>本应用按"现状"提供，不提供任何明示或暗示的保证。使用本应用即表示您同意自行承担相关风险。</p>
        </>
      ) : (
        <>
          <p>Last updated: April 2026</p>
          <h2>1. Service Description</h2>
          <p>CryptoSplit is a tool that helps users split expenses using cryptocurrency. This app does not custody any funds — all transactions are initiated by users through their wallets.</p>
          <h2>2. Risk Disclosure</h2>
          <ul>
            <li>Cryptocurrency price volatility may affect the actual value of settlements</li>
            <li>Blockchain transactions are irreversible — verify addresses and amounts before sending</li>
            <li>This application is not responsible for any transaction errors or losses</li>
          </ul>
          <h2>3. Data</h2>
          <p>All group and expense data is stored locally on your device. We cannot recover lost data.</p>
          <h2>4. Disclaimer</h2>
          <p>This application is provided "as is" without warranties of any kind. By using this app, you agree to assume all associated risks.</p>
        </>
      )}
    </div>
  );
}

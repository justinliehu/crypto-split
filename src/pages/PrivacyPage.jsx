import { useLocale } from '../contexts/LocaleContext';

export default function PrivacyPage() {
  const { t, locale } = useLocale();

  return (
    <div className="prose prose-sm max-w-none">
      <h1>{t('privacy_title')}</h1>
      {locale === 'zh' ? (
        <>
          <p><strong>生效日期：</strong>2026 年 4 月 3 日 &nbsp;|&nbsp; <strong>最后更新：</strong>2026 年 4 月 3 日</p>

          <p>CryptoSplit（以下简称"本应用"）是一款去中心化费用分摊工具。我们尊重并保护您的隐私。本隐私政策详细说明了我们在您使用本应用时如何处理信息。</p>

          <h2>1. 信息收集与使用</h2>
          <h3>1.1 我们不收集的信息</h3>
          <ul>
            <li>本应用不要求注册账号，不收集姓名、邮箱、电话号码等个人身份信息</li>
            <li>本应用不使用 Cookie 进行用户跟踪</li>
            <li>本应用不将任何数据上传至我们的服务器</li>
          </ul>

          <h3>1.2 钱包地址</h3>
          <p>当您连接加密货币钱包时，本应用会读取您的钱包公开地址。该地址仅用于以下目的：</p>
          <ul>
            <li>在应用内标识您的身份</li>
            <li>在群组中识别成员</li>
            <li>计算成员之间的债务关系</li>
            <li>发起链上结算交易时作为发送方/接收方地址</li>
          </ul>
          <p>钱包地址是区块链上的公开信息，不属于个人隐私数据。本应用不会将您的钱包地址发送至任何第三方服务器。</p>

          <h3>1.3 本地存储数据</h3>
          <p>本应用使用浏览器的 localStorage 存储以下数据：</p>
          <ul>
            <li>您创建的群组信息（群组名称、成员地址、昵称）</li>
            <li>账单记录（描述、金额、币种、付款人、分摊成员）</li>
            <li>语言偏好设置</li>
          </ul>
          <p>这些数据完全存储在您的设备本地，不会被传输至任何服务器。清除浏览器数据或卸载应用将永久删除这些记录，且无法恢复。</p>

          <h2>2. 第三方服务</h2>
          <h3>2.1 WalletConnect</h3>
          <p>本应用集成 WalletConnect 协议，允许您通过扫描二维码连接移动端钱包。WalletConnect 的使用受其自身的<a href="https://walletconnect.com/privacy" target="_blank" rel="noopener noreferrer">隐私政策</a>约束。通过 WalletConnect 建立的连接会话数据由 WalletConnect 网络处理。</p>

          <h3>2.2 区块链网络</h3>
          <p>当您使用本应用发起结算交易时，交易数据将被提交至相应的区块链网络（如 Ethereum、Solana）。区块链交易是公开的、不可篡改的，包括但不限于：</p>
          <ul>
            <li>发送方和接收方地址</li>
            <li>交易金额</li>
            <li>交易时间</li>
            <li>Gas 费用</li>
          </ul>
          <p>一旦交易被确认，将永久记录在区块链上，无法删除或修改。</p>

          <h3>2.3 RPC 节点</h3>
          <p>本应用通过公共 RPC 节点（如 Solana 的 mainnet-beta）与区块链交互。这些节点可能会记录您的 IP 地址和请求数据。我们建议使用 VPN 以增强隐私保护。</p>

          <h2>3. 数据安全</h2>
          <p>本应用采取以下措施保护您的数据：</p>
          <ul>
            <li>所有数据存储在本地，不经过任何中间服务器</li>
            <li>钱包签名操作由您的钱包应用独立完成，本应用无法访问您的私钥</li>
            <li>本应用不存储、传输或处理您的钱包私钥或助记词</li>
          </ul>

          <h2>4. 儿童隐私</h2>
          <p>本应用不面向 13 岁以下的儿童。我们不会有意收集儿童的个人信息。如果您是家长或监护人，发现您的孩子在使用本应用，请联系我们。</p>

          <h2>5. 隐私政策的变更</h2>
          <p>我们可能会不时更新本隐私政策。任何变更将在本页面发布，并更新"最后更新"日期。继续使用本应用即表示您接受更新后的隐私政策。</p>

          <h2>6. 您的权利</h2>
          <p>由于本应用不收集或存储您的个人数据于任何服务器，您可以随时：</p>
          <ul>
            <li>断开钱包连接以停止应用对您地址的读取</li>
            <li>清除浏览器 localStorage 以删除所有本地数据</li>
            <li>卸载应用以完全移除所有相关数据</li>
          </ul>

          <h2>7. 联系我们</h2>
          <p>如果您对本隐私政策有任何疑问，请通过应用内的反馈渠道联系我们。</p>
        </>
      ) : (
        <>
          <p><strong>Effective Date:</strong> April 3, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> April 3, 2026</p>

          <p>CryptoSplit ("the App") is a decentralized expense splitting tool. We respect and protect your privacy. This Privacy Policy explains how we handle information when you use the App.</p>

          <h2>1. Information Collection and Use</h2>
          <h3>1.1 Information We Do Not Collect</h3>
          <ul>
            <li>The App does not require account registration and does not collect personal identifying information such as names, emails, or phone numbers</li>
            <li>The App does not use cookies for user tracking</li>
            <li>The App does not upload any data to our servers</li>
          </ul>

          <h3>1.2 Wallet Address</h3>
          <p>When you connect a cryptocurrency wallet, the App reads your wallet's public address. This address is used solely for the following purposes:</p>
          <ul>
            <li>Identifying you within the App</li>
            <li>Identifying members within groups</li>
            <li>Calculating debts between members</li>
            <li>Serving as sender/receiver address when initiating on-chain settlement transactions</li>
          </ul>
          <p>Wallet addresses are public information on the blockchain and are not considered private personal data. The App does not send your wallet address to any third-party server.</p>

          <h3>1.3 Locally Stored Data</h3>
          <p>The App uses your browser's localStorage to store the following data:</p>
          <ul>
            <li>Groups you create (group names, member addresses, nicknames)</li>
            <li>Expense records (descriptions, amounts, currencies, payer, split members)</li>
            <li>Language preference settings</li>
          </ul>
          <p>This data is stored entirely on your device and is never transmitted to any server. Clearing browser data or uninstalling the App will permanently delete these records and they cannot be recovered.</p>

          <h2>2. Third-Party Services</h2>
          <h3>2.1 WalletConnect</h3>
          <p>The App integrates the WalletConnect protocol, allowing you to connect mobile wallets by scanning QR codes. Use of WalletConnect is subject to its own <a href="https://walletconnect.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. Session data established through WalletConnect is processed by the WalletConnect network.</p>

          <h3>2.2 Blockchain Networks</h3>
          <p>When you initiate settlement transactions through the App, transaction data is submitted to the respective blockchain network (e.g., Ethereum, Solana). Blockchain transactions are public and immutable, including but not limited to:</p>
          <ul>
            <li>Sender and receiver addresses</li>
            <li>Transaction amounts</li>
            <li>Transaction timestamps</li>
            <li>Gas/transaction fees</li>
          </ul>
          <p>Once confirmed, transactions are permanently recorded on the blockchain and cannot be deleted or modified.</p>

          <h3>2.3 RPC Nodes</h3>
          <p>The App interacts with blockchains through public RPC nodes (e.g., Solana's mainnet-beta). These nodes may log your IP address and request data. We recommend using a VPN for enhanced privacy protection.</p>

          <h2>3. Data Security</h2>
          <p>The App takes the following measures to protect your data:</p>
          <ul>
            <li>All data is stored locally and does not pass through any intermediary server</li>
            <li>Wallet signing operations are handled independently by your wallet application — the App cannot access your private keys</li>
            <li>The App does not store, transmit, or process your wallet private keys or seed phrases</li>
          </ul>

          <h2>4. Children's Privacy</h2>
          <p>The App is not intended for children under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child is using the App, please contact us.</p>

          <h2>5. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of the App constitutes acceptance of the updated Privacy Policy.</p>

          <h2>6. Your Rights</h2>
          <p>Since the App does not collect or store your personal data on any server, you may at any time:</p>
          <ul>
            <li>Disconnect your wallet to stop the App from reading your address</li>
            <li>Clear your browser's localStorage to delete all local data</li>
            <li>Uninstall the App to completely remove all related data</li>
          </ul>

          <h2>7. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us through the in-app feedback channel.</p>
        </>
      )}
    </div>
  );
}

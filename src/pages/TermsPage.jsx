import { useLocale } from '../contexts/LocaleContext';

export default function TermsPage() {
  const { t, locale } = useLocale();

  return (
    <div className="prose prose-sm max-w-none">
      <h1>{t('terms_title')}</h1>
      {locale === 'zh' ? (
        <>
          <p><strong>生效日期：</strong>2026 年 4 月 3 日 &nbsp;|&nbsp; <strong>最后更新：</strong>2026 年 4 月 3 日</p>

          <p>欢迎使用 CryptoSplit（以下简称"本应用"）。使用本应用即表示您同意受以下服务条款的约束。如果您不同意这些条款，请停止使用本应用。</p>

          <h2>1. 服务说明</h2>
          <p>CryptoSplit 是一款去中心化的费用分摊工具，帮助用户：</p>
          <ul>
            <li>创建群组并添加成员（通过钱包地址）</li>
            <li>记录和拆分共同费用</li>
            <li>计算成员间的债务关系</li>
            <li>通过区块链发起加密货币结算交易</li>
          </ul>
          <p>本应用不托管、保管或控制任何用户资金。所有交易由用户通过自己的加密货币钱包独立发起和确认。</p>

          <h2>2. 用户资格</h2>
          <p>使用本应用，您声明并保证：</p>
          <ul>
            <li>您已年满 18 周岁（或您所在司法管辖区的法定成年年龄）</li>
            <li>您拥有合法使用加密货币钱包和进行加密货币交易的能力</li>
            <li>您遵守您所在司法管辖区的所有适用法律法规</li>
          </ul>

          <h2>3. 钱包连接与身份</h2>
          <ul>
            <li>本应用使用您的加密货币钱包地址作为唯一标识符</li>
            <li>您有责任保管好自己的钱包私钥和助记词</li>
            <li>本应用不存储、访问或管理您的私钥</li>
            <li>如果您的钱包被盗或丢失，我们无法帮助您恢复资金</li>
          </ul>

          <h2>4. 费用分摊与债务</h2>
          <ul>
            <li>本应用提供的费用拆分计算仅为建议性质，不构成法律上的债务关系</li>
            <li>群组成员之间的实际付款义务由成员自行协商确定</li>
            <li>本应用不仲裁、调解或执行成员间的债务纠纷</li>
          </ul>

          <h2>5. 区块链交易</h2>
          <h3>5.1 交易的不可逆性</h3>
          <p>通过本应用发起的区块链交易一经确认即不可撤销。在发起交易前，请务必仔细核实：</p>
          <ul>
            <li>收款地址的准确性</li>
            <li>转账金额的正确性</li>
            <li>所选区块链网络是否正确</li>
            <li>所选币种是否正确</li>
          </ul>

          <h3>5.2 Gas 费用</h3>
          <p>区块链交易需要支付网络手续费（Gas 费）。该费用由区块链网络收取，与本应用无关。本应用不收取任何额外费用。</p>

          <h3>5.3 支持的加密货币</h3>
          <p>本应用目前支持以下加密货币的记账和结算：</p>
          <ul>
            <li><strong>ETH</strong>（Ethereum）— EVM 链原生代币</li>
            <li><strong>SOL</strong>（Solana）— Solana 链原生代币</li>
            <li><strong>SKR</strong>（Seeker Token）— Solana 链上的 SPL 代币</li>
            <li><strong>MATIC</strong>（Polygon）、<strong>BNB</strong>（BNB Chain）— EVM 链原生代币</li>
            <li><strong>USDT</strong>、<strong>USDC</strong> — 稳定币（仅记账，链上结算功能开发中）</li>
          </ul>

          <h2>6. 风险声明</h2>
          <p>使用本应用和加密货币涉及以下风险，您需自行承担：</p>
          <ul>
            <li><strong>价格波动风险：</strong>加密货币价格可能剧烈波动，记账时的金额可能在结算时有显著差异</li>
            <li><strong>技术风险：</strong>区块链网络可能出现拥堵、故障或安全漏洞</li>
            <li><strong>智能合约风险：</strong>代币合约可能存在未知漏洞</li>
            <li><strong>操作风险：</strong>发送至错误地址的加密货币无法追回</li>
            <li><strong>监管风险：</strong>加密货币的法律地位可能因司法管辖区而异</li>
            <li><strong>数据丢失风险：</strong>本地存储的数据可能因设备损坏、浏览器清理等原因丢失</li>
          </ul>

          <h2>7. 数据与存储</h2>
          <ul>
            <li>所有群组和账单数据存储在您设备的本地浏览器中</li>
            <li>我们不提供云备份或数据恢复服务</li>
            <li>您有责任自行备份重要数据</li>
            <li>更换设备或清除浏览器数据将导致所有记录丢失</li>
          </ul>

          <h2>8. 知识产权</h2>
          <p>本应用的所有内容、设计、代码和商标均受知识产权法保护。未经授权，您不得复制、修改、分发或以其他方式使用本应用的任何部分。</p>

          <h2>9. 免责声明</h2>
          <p>本应用按"现状"和"可用"的基础提供，不提供任何明示或暗示的保证，包括但不限于：</p>
          <ul>
            <li>适销性保证</li>
            <li>特定用途适用性保证</li>
            <li>不侵权保证</li>
            <li>持续可用性或无错误运行的保证</li>
          </ul>
          <p>在适用法律允许的最大范围内，本应用的开发者不对因使用或无法使用本应用而产生的任何直接、间接、附带、特殊或后果性损害承担责任。</p>

          <h2>10. 赔偿</h2>
          <p>您同意赔偿并使本应用的开发者免受因您使用本应用、违反本条款或侵犯任何第三方权利而引起的任何索赔、损害、损失和费用。</p>

          <h2>11. 条款变更</h2>
          <p>我们保留随时修改本服务条款的权利。修改后的条款将在本页面发布，并更新"最后更新"日期。继续使用本应用即视为接受修改后的条款。</p>

          <h2>12. 适用法律</h2>
          <p>本服务条款受适用法律管辖。因本条款引起的任何争议应通过友好协商解决。</p>

          <h2>13. 联系方式</h2>
          <p>如果您对本服务条款有任何疑问或建议，请通过应用内的反馈渠道联系我们。</p>
        </>
      ) : (
        <>
          <p><strong>Effective Date:</strong> April 3, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> April 3, 2026</p>

          <p>Welcome to CryptoSplit ("the App"). By using the App, you agree to be bound by the following Terms of Service. If you do not agree to these terms, please stop using the App.</p>

          <h2>1. Service Description</h2>
          <p>CryptoSplit is a decentralized expense splitting tool that helps users:</p>
          <ul>
            <li>Create groups and add members (via wallet addresses)</li>
            <li>Record and split shared expenses</li>
            <li>Calculate debts between members</li>
            <li>Initiate cryptocurrency settlement transactions on the blockchain</li>
          </ul>
          <p>The App does not custody, hold, or control any user funds. All transactions are independently initiated and confirmed by users through their own cryptocurrency wallets.</p>

          <h2>2. User Eligibility</h2>
          <p>By using the App, you represent and warrant that:</p>
          <ul>
            <li>You are at least 18 years old (or the legal age of majority in your jurisdiction)</li>
            <li>You have the legal capacity to use cryptocurrency wallets and conduct cryptocurrency transactions</li>
            <li>You comply with all applicable laws and regulations in your jurisdiction</li>
          </ul>

          <h2>3. Wallet Connection and Identity</h2>
          <ul>
            <li>The App uses your cryptocurrency wallet address as a unique identifier</li>
            <li>You are responsible for safeguarding your wallet private keys and seed phrases</li>
            <li>The App does not store, access, or manage your private keys</li>
            <li>If your wallet is compromised or lost, we cannot help you recover funds</li>
          </ul>

          <h2>4. Expense Splitting and Debts</h2>
          <ul>
            <li>The expense splitting calculations provided by the App are advisory in nature and do not constitute a legal debt relationship</li>
            <li>Actual payment obligations between group members are determined by the members themselves</li>
            <li>The App does not arbitrate, mediate, or enforce debt disputes between members</li>
          </ul>

          <h2>5. Blockchain Transactions</h2>
          <h3>5.1 Irreversibility of Transactions</h3>
          <p>Blockchain transactions initiated through the App are irreversible once confirmed. Before initiating a transaction, please carefully verify:</p>
          <ul>
            <li>The accuracy of the recipient address</li>
            <li>The correctness of the transfer amount</li>
            <li>The correct blockchain network is selected</li>
            <li>The correct cryptocurrency is selected</li>
          </ul>

          <h3>5.2 Gas Fees</h3>
          <p>Blockchain transactions require network fees (gas fees). These fees are charged by the blockchain network and are unrelated to the App. The App does not charge any additional fees.</p>

          <h3>5.3 Supported Cryptocurrencies</h3>
          <p>The App currently supports the following cryptocurrencies for accounting and settlement:</p>
          <ul>
            <li><strong>ETH</strong> (Ethereum) — EVM chain native token</li>
            <li><strong>SOL</strong> (Solana) — Solana chain native token</li>
            <li><strong>SKR</strong> (Seeker Token) — SPL token on Solana</li>
            <li><strong>MATIC</strong> (Polygon), <strong>BNB</strong> (BNB Chain) — EVM chain native tokens</li>
            <li><strong>USDT</strong>, <strong>USDC</strong> — Stablecoins (accounting only, on-chain settlement in development)</li>
          </ul>

          <h2>6. Risk Disclosure</h2>
          <p>Using the App and cryptocurrencies involves the following risks, which you assume:</p>
          <ul>
            <li><strong>Price Volatility:</strong> Cryptocurrency prices can fluctuate significantly; amounts recorded may differ substantially at settlement time</li>
            <li><strong>Technical Risk:</strong> Blockchain networks may experience congestion, failures, or security vulnerabilities</li>
            <li><strong>Smart Contract Risk:</strong> Token contracts may contain unknown vulnerabilities</li>
            <li><strong>Operational Risk:</strong> Cryptocurrency sent to incorrect addresses cannot be recovered</li>
            <li><strong>Regulatory Risk:</strong> The legal status of cryptocurrencies varies by jurisdiction</li>
            <li><strong>Data Loss Risk:</strong> Locally stored data may be lost due to device damage, browser clearing, etc.</li>
          </ul>

          <h2>7. Data and Storage</h2>
          <ul>
            <li>All group and expense data is stored in your device's local browser storage</li>
            <li>We do not provide cloud backup or data recovery services</li>
            <li>You are responsible for backing up important data</li>
            <li>Switching devices or clearing browser data will result in loss of all records</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>All content, design, code, and trademarks of the App are protected by intellectual property laws. You may not copy, modify, distribute, or otherwise use any part of the App without authorization.</p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>The App is provided on an "as is" and "as available" basis, without any warranties of any kind, express or implied, including but not limited to:</p>
          <ul>
            <li>Warranties of merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Continuous availability or error-free operation</li>
          </ul>
          <p>To the maximum extent permitted by applicable law, the developers of the App shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use or inability to use the App.</p>

          <h2>10. Indemnification</h2>
          <p>You agree to indemnify and hold harmless the developers of the App from any claims, damages, losses, and expenses arising from your use of the App, violation of these terms, or infringement of any third-party rights.</p>

          <h2>11. Changes to Terms</h2>
          <p>We reserve the right to modify these Terms of Service at any time. Modified terms will be posted on this page with an updated "Last Updated" date. Continued use of the App constitutes acceptance of the modified terms.</p>

          <h2>12. Governing Law</h2>
          <p>These Terms of Service are governed by applicable law. Any disputes arising from these terms shall be resolved through amicable negotiation.</p>

          <h2>13. Contact</h2>
          <p>If you have any questions or suggestions about these Terms of Service, please contact us through the in-app feedback channel.</p>
        </>
      )}
    </div>
  );
}

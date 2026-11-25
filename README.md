# security-audit-lab

Solidity 合约安全练习集：**一份 6 问题的审计报告 + 一个重入攻击 PoC + 10 条单元测试 + 跨链部署记录 + 链上查询脚本**。

> 先说清楚：审计对象是我自己的 Hardhat 学习项目（FlashSwap / MockERC20），不是生产合约。这个仓库要证明的不是「我能审主网协议」，而是**「Slither 扫描 → 人工复核 → 写 PoC 验证 → 修复后重跑」这条流程我能独立走完，且每一步留得下可复现的证据**。
>
> *EN: A Solidity security practice repo — a 6-finding audit report (incl. one High found by manual review, missed by Slither), a reentrancy PoC, 10 unit tests, multi-chain deployment records, and on-chain query scripts. Testnet only; learning projects, not production audits.*

---

## 目录

| 目录 | 内容 | 关键数字 |
|---|---|---|
| `01-audit/` | 合约审计报告 + Slither 原始输出 + 被审合约 | 6 个问题（High 1 / Medium 1 / Low 2 / Info 2） |
| `02-reentrancy-poc/` | 重入攻击 PoC（漏洞版 + CEI 修复版） | 2 passing（攻击成功 + 修复有效） |
| `03-unit-test/` | MiniBank 单元测试 | 10 passing |
| `04-deployments/` | CommitReveal / MyERC20 部署记录 | Sepolia 2 次、Monad 1 次，交易哈希可查 |
| `05-onchain-query/` | Python / TypeScript 链上查询脚本 + 运行日志 | 2 份日志 |
| `06-fabric/` | Hyperledger Fabric 实验记录与操作手册 | 实验 1–7 |
| `07-ethernaut/` | Ethernaut 闯关记录 | 进行中 |

---

## 1. 审计：FlashSwap + MockERC20

- **工具**：Slither 0.11.6 + solc 0.8.20，人工审查补充
- **结论**：6 个问题

| 级别 | 问题 | 发现方式 |
|---|---|---|
| High | `MockERC20.mint` 无权限控制，任何人可无限铸币 | **人工审查**（Slither 默认 102 个检测器未报） |
| Medium | `FlashSwap` 还款 `transfer` 未检查返回值 | Slither `unchecked-transfer` |
| Low | 构造函数地址缺零检查 | Slither `missing-zero-check` |
| Low | 构造函数参数遮蔽父类 | Slither `shadowing-local` |
| Info | 编译器版本不统一 | Slither `solc-version` |
| Info | 命名不规范 | Slither `naming-convention` |

- **修复验证**：生成 `FlashSwap_Fixed.sol`（transfer 外包 `require`），重跑 Slither，`unchecked-transfer` 告警消失（12 → 11 条）
- **原始输出**：`slither_FlashSwap_原始报告.txt`、`slither_MockERC20_原始报告.txt`，可与结论逐条对账

> 这份报告最值钱的一行不是那 6 个问题，是这句：**工具没报的 High，是我读代码读出来的**。

## 2. 重入攻击 PoC

- 漏洞版 `VulnerableBank`：`call` 转账在记账之前，攻击合约在 `receive()` 里递归 `withdraw`
- 实测：受害者 1 ETH + 攻击者 1 ETH → 银行 2 ETH 被榨干，攻击合约拿到 3 ETH
- 修复版 `SafeBank`：按 CEI（Checks-Effects-Interactions）先清零再转账，第二次取款因余额为 0 被回滚
- `npx hardhat test test/reentrancy.test.js` → **2 passing**，日志见 `重入PoC_测试结果.txt`

## 3. 单元测试：MiniBank

10 条用例，覆盖部署、存款、取款、多人隔离四组，用了 `loadFixture`（每个用例重置链上状态）和 `changeEtherBalances`（断言 ETH 转账方向）。
`npx hardhat test test/minibank.test.js` → **10 passing**。

## 4. 部署记录（链上可查）

| 合约 | 网络 | 地址 | 交易 |
|---|---|---|---|
| CommitReveal | Sepolia | `0x6F84A0A3f76a365B11B94A8316A9Bf5f78f7845b` | `0x365fbd79…c24979` |
| MyERC20 | Sepolia | `0xc917b9d23aC94c610939De7B9b84CC0d7a3B288D` | 见 `myerc20-sepolia.md` |
| MyERC20 | Monad Testnet (10143) | `0x165306A2ccdF9Fb75e21253286A91d38ea09BD6e` | `0xf5114df7…ab7b51c` |

- CommitReveal：commit 50 块 / reveal 50 块，6/6 本地测试通过（重复 commit、答案不符、提前 reveal、重复 reveal、超时均 revert）
- MyERC20：**不依赖 OpenZeppelin 手写** ERC20 五接口，`forge test` 5/5 通过；Sepolia 与 Monad 两条链部署同一份字节码，链上读写函数验证通过

## 5. 链上查询

- `query_chain.py`：web3.py 查余额 / 交易回执 / 合约代码，日志 `query_chain_run.log`
- `query_contract.ts`：ethers 调合约只读方法，日志 `query_contract_run.log`

## 6. Fabric

实验 1–7：测试网络、部署合约到通道、合约升级、Go/TypeScript 应用、商业票据、私有数据、CouchDB。见 `Fabric实验记录.md` 与 `Fabric测试网络操作手册.md`。

## 7. Ethernaut

闯关记录在 `07-ethernaut/progress.txt`，含实例地址与关卡地址。

---

## 工具链

Slither 0.11.6 · solc 0.8.20 · Hardhat · Foundry（forge test / forge create）· web3.py · ethers.js · Hyperledger Fabric 2.5

## 怎么复现

```bash
# 审计
slither contracts/FlashSwap.sol --solc <solc路径> \
  --solc-remaps "@openzeppelin/=node_modules/@openzeppelin/"

# 重入 PoC / 单元测试（Hardhat 工程内）
npx hardhat test test/reentrancy.test.js   # 2 passing
npx hardhat test test/minibank.test.js     # 10 passing

# MyERC20（Foundry 工程内）
forge build && forge test                  # 5/5
```

## 边界

- 审计结论只针对本仓库内的学习项目，**不构成正式审计意见**
- 不接资金盘、貔貅盘、仿盘拉盘；不接触私钥与助记词
- 所有部署都在测试网，无主网资产

## 许可证

MIT —— 可自由引用、修改、商用，保留版权声明即可，见 [LICENSE](LICENSE)。

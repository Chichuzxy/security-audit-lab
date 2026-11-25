# CommitReveal 简化版 - 部署记录（8/27 实操）

## 机制一句话
先提交答案哈希（commit），后公开答案（reveal），防止先手抄袭。类比：考试先交卷但密封，全部交完再统一开封。

## 链上信息（Sepolia 测试网）
- 合约地址: 0x6F84A0A3f76a365B11B94A8316A9Bf5f78f7845b
- 部署交易: 0x365fbd79c29189eaec2bf6c8a3a53c23b8584500b0bc9e53b29365e927c24979
- startBlock: 11578275
- Commit 窗口: 50 块（部署起 50 块内可提交）
- Reveal 窗口: 50 块（commit 结束后 50 块内可公开，超时视为放弃）
- 部署账户: 0x147Fcf3EB8B9E305a5b4e16cbba90462F7126db9

## 浏览器链接
- 合约: https://sepolia.etherscan.io/address/0x6F84A0A3f76a365B11B94A8316A9Bf5f78f7845b
- 交易: https://sepolia.etherscan.io/tx/0x365fbd79c29189eaec2bf6c8a3a53c23b8584500b0bc9e53b29365e927c24979

## 验证材料
1. 链上代码确认: eth_getCode 返回非空字节码（RPC 验证通过）
2. 本地测试: npx hardhat test test/CommitReveal.test.js 6/6 通过
   - commit 成功后 reveal 通过（完整流程）
   - 重复 commit 会 revert
   - reveal 时答案与承诺不符会 revert
   - 还没到 reveal 阶段就 reveal 会 revert
   - 重复 reveal 会 revert
   - reveal 超时后视为放弃（revert）

## 合约要点（面试可讲）
- commit 存 keccak256(abi.encodePacked(answer, salt))，salt 随机数防暴力猜答案
- reveal 时公开 answer + salt，合约重算哈希比对
- 超时机制：commit 截止后不能再提交；reveal 截止后未 reveal 视为放弃，防止卡流程
- 对应 AgentAudit 项目场景：审计报告提交防抄袭、VUL-ID 防重复领奖

## 部署环境备注
- 项目: E:\XZ\tuanduei\学习项目\DAPP\hardhat-example\Hardhat 的基本使用
- RPC 已从失效的 drpc.org 换成 ethereum-sepolia-rpc.publicnode.com（免费公共）
- 源码见同目录 CommitReveal.sol；测试见项目 test/CommitReveal.test.js

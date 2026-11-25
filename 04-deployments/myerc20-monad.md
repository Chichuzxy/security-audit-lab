# 手写 ERC20（MyERC20）- Monad 测试网部署记录（8/30 实操）

## 机制一句话
不依赖 OpenZeppelin，纯手写实现 ERC20 五个标准接口：totalSupply / balanceOf / transfer / approve / transferFrom。类比：totalSupply=银行印钞总量，balanceOf=查账户余额，transfer=自己转账，approve=给某人开额度支票，transferFrom=凭支票代扣。

## 链上信息（Monad Testnet，Chain ID 10143）
- 合约地址: 0x165306A2ccdF9Fb75e21253286A91d38ea09BD6e
- 部署交易: 0xf5114df7039337fd8974a94701a5d8ae158bc1b078e869ec5cfd665a2ab7b51c
- 部署账户: 0x147Fcf3EB8B9E305a5b4e16cbba90462F7126db9
- 初始供应量: 1,000,000 M20（decimals=18，即 1e24 wei），与 Sepolia 部署参数完全一致
- 链上功能演示 transfer: 0x79c48dfa74f125b0e78e89c9023bfb486dd4673e54e10cb0f376ee0af488cf4c
  （部署者转 100 M20 给 0x1111...1111，status=1 success，接收方余额验证 = 100 * 1e18）

## 浏览器链接（Monad 官方浏览器 MonadVision）
- 合约: https://testnet.monadvision.com/address/0x165306A2ccdF9Fb75e21253286A91d38ea09BD6e
- 部署交易: https://testnet.monadvision.com/tx/0xf5114df7039337fd8974a94701a5d8ae158bc1b078e869ec5cfd665a2ab7b51c
- transfer 演示: https://testnet.monadvision.com/tx/0x79c48dfa74f125b0e78e89c9023bfb486dd4673e54e10cb0f376ee0af488cf4c
- 说明: 旧域名 testnet.monadexplorer.com 已 308 重定向到 testnet.monadvision.com（Monad 官方新浏览器，SSR 渲染，页面可查地址/交易哈希）

## 验证材料
1. 编译: forge build 通过（solc 0.8.24，仅 lint 提示无错误）
2. 单元测试: forge test 5/5 通过（totalSupply / transfer / 余额不足 revert / approve+transferFrom / 超额度 revert）
3. 链上代码确认: eth_getCode 返回 6567 字节非空字节码（与 Sepolia 部署字节数一致，同一合约）
4. 链上读函数: name=MyERC20, symbol=M20, decimals=18, totalSupply=1e24, balanceOf(部署者)=1e24 全部正确
5. 链上写函数: 真实 transfer 交易 status=1，接收方余额 100 * 1e18 验证通过
6. 浏览器确认: 合约页 + 部署交易页 + transfer 交易页在 MonadVision 均可打开且包含对应哈希

## 合约要点（面试可讲，标准 ERC20 实现）
- 两个核心 mapping：balanceOf 记余额，allowance 记授权额度（owner -> spender -> 额度）
- transfer 内部走 _transfer(from=msg.sender, to, value)，先查余额再扣减
- transferFrom 先查 allowance >= value，扣减额度后再 _transfer，顺序是 checks-effects-interactions（先检查-后改状态-再交互）
- Solidity 0.8 内置溢出检查：不需要 SafeMath，余额不足/额度不足靠 require 提前拦住
- 没有用 OpenZeppelin 的 ERC20.sol，全部逻辑手写，面试可当场默写

## 部署环境备注
- 项目: E:\XZ\计算机二级Java考试\证据\MyERC20（foundry 项目，src/MyERC20.sol + test/MyERC20.t.sol）
- RPC: https://testnet-rpc.monad.xyz（Monad 官方测试网 RPC）
- 工具: Foundry（forge build / forge test / forge create --broadcast）
- 私钥: 复用 ai-monad-explorer 项目 .env（PRIVATE_KEY），未写入本目录
- 部署账户 Monad 余额: 约 179.78 MON（领水来源 faucet.monad.xyz）
- 同合约 Sepolia 部署先例: 0xc917b9d23aC94c610939De7B9b84CC0d7a3B288D（见 部署记录.md）

## 简历使用建议
"手写 ERC20（无 OpenZeppelin 依赖）跨链部署：Sepolia + Monad 测试网，5/5 单元测试通过，链上读/写函数验证，浏览器可查。" 面试可现场默写合约。

# 手写 ERC20（MyERC20）- 部署记录（8/28 实操）

## 机制一句话
不依赖 OpenZeppelin，纯手写实现 ERC20 五个标准接口：totalSupply / balanceOf / transfer / approve / transferFrom。类比：totalSupply=银行印钞总量，balanceOf=查账户余额，transfer=自己转账，approve=给某人开额度支票，transferFrom=凭支票代扣。

## 链上信息（Sepolia 测试网）
- 合约地址: 0xc917b9d23aC94c610939De7B9b84CC0d7a3B288D
- 部署交易: 0x7115412e134b291c9886db60bae2eab4ddb5c4070a1fe25a73608da5f0267290
- 部署账户: 0x147Fcf3EB8B9E305a5b4e16cbba90462F7126db9
- 初始供应量: 1,000,000 M20（decimals=18，即 1e24 wei）
- 链上功能演示 transfer: 0x6d0ed7e5d07fd05e23ef6a79c098a3494f348568baa21cc0b1703246f6c18c92
  （部署者转 100 M20 给 0x1111...1111，status=1 success，接收方余额验证 = 100 * 1e18）

## 浏览器链接
- 合约: https://sepolia.etherscan.io/address/0xc917b9d23aC94c610939De7B9b84CC0d7a3B288D
- 部署交易: https://sepolia.etherscan.io/tx/0x7115412e134b291c9886db60bae2eab4ddb5c4070a1fe25a73608da5f0267290
- transfer 演示: https://sepolia.etherscan.io/tx/0x6d0ed7e5d07fd05e23ef6a79c098a3494f348568baa21cc0b1703246f6c18c92

## 验证材料
1. 编译: forge build 通过（solc 0.8.24，无警告报错）
2. 单元测试: forge test 5/5 通过
   - totalSupply 正确，初始代币全在部署者手里
   - transfer 正常转账，余额同步扣减
   - 余额不足 transfer 会 revert（insufficient balance）
   - approve + transferFrom 正常代扣，额度用后归零
   - transferFrom 超额度会 revert（allowance exceeded）
3. 链上代码确认: eth_getCode 返回 6567 字节非空字节码
4. 链上读函数: name=MyERC20, symbol=M20, decimals=18, totalSupply=1e24, balanceOf(部署者)=1e24 全部正确
5. 链上写函数: 真实 transfer 交易 status=1，接收方余额 100 * 1e18 验证通过

## 合约要点（面试可讲，标准 ERC20 实现）
- 两个核心 mapping：balanceOf 记余额，allowance 记授权额度（owner -> spender -> 额度）
- transfer 内部走 _transfer(from=msg.sender, to, value)，先查余额再扣减
- transferFrom 先查 allowance >= value，扣减额度后再 _transfer，顺序是 checks-effects-interactions（先检查-后改状态-再交互）
- Solidity 0.8 内置溢出检查：不需要 SafeMath，余额不足/额度不足靠 require 提前拦住
- 没有用 OpenZeppelin 的 ERC20.sol，全部逻辑手写，面试可当场默写

## 部署环境备注
- 项目: E:\XZ\计算机二级Java考试\证据\MyERC20（foundry 项目，src/MyERC20.sol + test/MyERC20.t.sol）
- RPC: ethereum-sepolia-rpc.publicnode.com（免费公共）
- 工具: Foundry（forge build / forge test / forge create --broadcast）
- 私钥: 复用 hardhat 项目的 .env（SEPOLIA_RPC_URL + PRIVATE_KEY），未写入本目录

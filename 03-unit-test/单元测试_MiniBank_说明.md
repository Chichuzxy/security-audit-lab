# 单元测试说明（简历"编写全量单元测试"卖点）

- 日期：2026-08-26
- 位置：hardhat-example/Hardhat 的基本使用/contracts/UnitTestDemo/MiniBank.sol + test/minibank.test.js
- 结果：10 passing（真实运行）

==============================
一、测试对象
==============================
MiniBank：演示用的小银行合约
- deposit()：存款，带 Deposit 事件
- withdraw()：取款（CEI 模式），带 Withdraw 事件
- getBalanceOf() / getTotalBalance()：查询余额

==============================
二、测试覆盖（10 项，按断言类型分组）
==============================
部署类：
1. owner 应该是部署者
2. 初始总余额应为 0

存款类：
3. 存款后余额增加，合约总余额增加（余额断言）
4. 存款金额必须大于 0（require 回滚断言）
5. 存款时应发出 Deposit 事件（事件断言）

取款类：
6. 取款后余额减少，ETH 转回用户（changeEtherBalances 转账断言）
7. 余额不足时取款应被回滚（回滚断言）
8. 取款金额必须大于 0（回滚断言）
9. 取款时应发出 Withdraw 事件（事件断言）

多人存取类：
10. 多人存款互不影响，各自余额独立（余额隔离断言）

==============================
三、测试技术点（面试可讲）
==============================
- loadFixture：每个测试前重置链上状态，测试互相独立
- changeEtherBalances：断言 ETH 转账方向正确（alice +X，合约 -X）
- to.emit(...).withArgs(...)：断言事件及参数
- to.be.revertedWith("..."):断言回滚原因
- connect(signer)：模拟不同账户调用

==============================
四、面试话术
==============================
我写过完整的合约单元测试：用 Hardhat + Chai 给 MiniBank 写了 10 个测试，
覆盖部署状态、存取款余额、事件参数、转账方向、回滚条件、多账户隔离，
npx hardhat test 全部通过。测试用 loadFixture 保证用例隔离，
changeEtherBalances 验证资金流向，emit/withArgs 验证事件。

==============================
五、涉及文件
==============================
contracts/UnitTestDemo/MiniBank.sol  被测合约
test/minibank.test.js                测试脚本（10 passing）

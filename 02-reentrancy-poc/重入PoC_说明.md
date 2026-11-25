# 重入攻击 PoC 说明（简历"重入攻击排查能力"证据）

- 日期：2026-08-25
- 位置：hardhat-example/Hardhat 的基本使用/contracts/Reentrancy/ + test/reentrancy.test.js
- 结果：2 passing（攻击成功 + 修复有效）

==============================
一、漏洞版原理（VulnerableBank.sol）
==============================
漏洞代码（withdraw）：
  uint bal = balances[msg.sender];
  require(bal > 0);
  msg.sender.call{value: bal}("");  // 先转账（触发对方 receive）
  balances[msg.sender] = 0;          // 后记账（太晚了！）

攻击流程（ReentrancyAttack.sol）：
1. attack() 先 deposit 1 ETH 拿到存款记录
2. 调 withdraw() -> 银行转账给攻击合约 -> 触发 receive()
3. receive() 里 balance >= 1 ETH 时再次调 withdraw()
4. 此时 balances 还没清零，又能取一次 -> 循环直到银行榨干

测试验证：受害者 1 ETH + 攻击者 1 ETH 存入 = 银行 2 ETH，
攻击后银行余额 0，攻击合约拿到 3 ETH（含自己那笔）——攻击成功。

==============================
二、修复版原理（SafeBank.sol，CEI 模式）
==============================
修复代码（withdraw）：
  uint bal = balances[msg.sender];
  require(bal > 0);                  // Checks：检查
  balances[msg.sender] = 0;          // Effects：先记账（清零）
  msg.sender.call{value: bal}("");   // Interactions：再转账

修复逻辑：转账前余额已清零，receive() 里第二次 withdraw 时
require(bal > 0) 失败 -> 整个攻击交易回滚 -> 受害者资金安全。

测试验证：攻击交易被 revert，银行余额保持 1 ETH 不变——修复有效。

==============================
三、面试话术
==============================
我写过重入攻击 PoC 并验证修复：漏洞版用 call 转账+后记账，
攻击合约在 receive() 里递归取款，1 ETH 撬动 3 ETH；
修复版按 CEI 模式先记账后转账，重入第二次取款因余额清零被回滚，
Hardhat 测试 2 项全部通过（攻击成功 + 修复有效）。

==============================
四、涉及文件
==============================
contracts/Reentrancy/VulnerableBank.sol  漏洞版银行
contracts/Reentrancy/ReentrancyAttack.sol 攻击合约
contracts/Reentrancy/SafeBank.sol        CEI 修复版银行
test/reentrancy.test.js                  测试（2 passing）

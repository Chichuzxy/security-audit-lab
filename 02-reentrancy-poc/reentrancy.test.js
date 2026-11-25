const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("重入攻击 PoC", function () {
  let vulnerableBank, safeBank, attack;
  let deployer, attacker;
  const DEPOSIT = ethers.parseEther("1");

  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();

    // 部署有漏洞的银行
    const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
    vulnerableBank = await VulnerableBank.deploy();

    // 部署修复版银行
    const SafeBank = await ethers.getContractFactory("SafeBank");
    safeBank = await SafeBank.deploy();

    // 部署攻击合约（指向有漏洞的银行）
    const ReentrancyAttack = await ethers.getContractFactory("ReentrancyAttack");
    attack = await ReentrancyAttack.deploy(await vulnerableBank.getAddress());
  });

  it("1. 漏洞版：攻击者用 1 ETH 榨干银行 3 ETH（攻击成功）", async function () {
    // 受害者（deployer）和攻击者各存 1 ETH，加攻击者再存 1 ETH = 银行共 3 ETH
    await vulnerableBank.connect(deployer).deposit({ value: DEPOSIT });
    await vulnerableBank.connect(attacker).deposit({ value: DEPOSIT });

    const bankBefore = await vulnerableBank.getBalance();
    expect(bankBefore).to.equal(ethers.parseEther("2")); // 2 ETH

    // 攻击者发起攻击：存 1 ETH 后立刻取款，利用重入循环取钱
    await attack.connect(attacker).attack({ value: DEPOSIT });

    // 银行被榨干，余额为 0
    const bankAfter = await vulnerableBank.getBalance();
    expect(bankAfter).to.equal(0);

    // 攻击合约拿到了银行里所有的钱（2 ETH 受害者 + 1 ETH 自己的，共 3 ETH）
    const attackBalance = await ethers.provider.getBalance(await attack.getAddress());
    expect(attackBalance).to.equal(ethers.parseEther("3"));
    console.log("   [漏洞版] 银行余额: 2 ETH ->", bankAfter.toString(), "| 攻击合约余额:", ethers.formatEther(attackBalance), "ETH");
  });

  it("2. 修复版：CEI 模式后攻击失败，攻击交易被回滚，受害者资金安全", async function () {
    // 受害者存 1 ETH
    await safeBank.connect(deployer).deposit({ value: DEPOSIT });

    // 攻击者部署攻击合约（指向 SafeBank）
    const SafeAttack = await ethers.getContractFactory("ReentrancyAttack");
    const attackSafe = await SafeAttack.deploy(await safeBank.getAddress());

    // 攻击交易应整体 revert：第一次取款后余额已清零，
    // receive() 里第二次 withdraw 的 require(bal > 0) 失败 -> 整个交易回滚
    await expect(
      attackSafe.connect(attacker).attack({ value: DEPOSIT })
    ).to.be.reverted;

    // 回滚后银行余额不变：受害者的 1 ETH 还在（攻击者存入的 1 ETH 也回滚了）
    const bankAfter = await safeBank.getBalance();
    expect(bankAfter).to.equal(DEPOSIT);
    console.log("   [修复版] 攻击被回滚，银行余额:", ethers.formatEther(bankAfter), "ETH (受害者资金安全)");
  });
});

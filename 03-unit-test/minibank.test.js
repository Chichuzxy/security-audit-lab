const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("MiniBank 单元测试", function () {
  // fixture：每个测试前重置到同一初始状态
  async function deployMiniBankFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const MiniBank = await ethers.getContractFactory("MiniBank");
    const bank = await MiniBank.deploy();
    return { bank, owner, alice, bob };
  }

  describe("部署", function () {
    it("owner 应该是部署者", async function () {
      const { bank, owner } = await loadFixture(deployMiniBankFixture);
      expect(await bank.owner()).to.equal(owner.address);
    });

    it("初始总余额应为 0", async function () {
      const { bank } = await loadFixture(deployMiniBankFixture);
      expect(await bank.getTotalBalance()).to.equal(0);
    });
  });

  describe("存款", function () {
    it("存款后余额增加，合约总余额增加", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      const amount = ethers.parseEther("1");

      await bank.connect(alice).deposit({ value: amount });

      expect(await bank.getBalanceOf(alice.address)).to.equal(amount);
      expect(await bank.getTotalBalance()).to.equal(amount);
    });

    it("存款金额必须大于 0", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      await expect(
        bank.connect(alice).deposit({ value: 0 })
      ).to.be.revertedWith("amount must > 0");
    });

    it("存款时应发出 Deposit 事件", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      const amount = ethers.parseEther("0.5");

      await expect(bank.connect(alice).deposit({ value: amount }))
        .to.emit(bank, "Deposit")
        .withArgs(alice.address, amount);
    });
  });

  describe("取款", function () {
    it("取款后余额减少，ETH 转回用户", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      const depositAmount = ethers.parseEther("2");
      const withdrawAmount = ethers.parseEther("1");

      await bank.connect(alice).deposit({ value: depositAmount });

      // 用 changeEtherBalances 断言转账：alice +1 ETH，合约 -1 ETH
      await expect(
        bank.connect(alice).withdraw(withdrawAmount)
      ).to.changeEtherBalances(
        [alice.address, bank.target],
        [withdrawAmount, -withdrawAmount]
      );

      expect(await bank.getBalanceOf(alice.address)).to.equal(withdrawAmount); // 剩 1
    });

    it("余额不足时取款应被回滚", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      await expect(
        bank.connect(alice).withdraw(ethers.parseEther("1"))
      ).to.be.revertedWith("insufficient balance");
    });

    it("取款金额必须大于 0", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      await expect(
        bank.connect(alice).withdraw(0)
      ).to.be.revertedWith("amount must > 0");
    });

    it("取款时应发出 Withdraw 事件", async function () {
      const { bank, alice } = await loadFixture(deployMiniBankFixture);
      await bank.connect(alice).deposit({ value: ethers.parseEther("1") });

      await expect(bank.connect(alice).withdraw(ethers.parseEther("1")))
        .to.emit(bank, "Withdraw")
        .withArgs(alice.address, ethers.parseEther("1"));
    });
  });

  describe("多人存取", function () {
    it("多人存款互不影响，各自余额独立", async function () {
      const { bank, alice, bob } = await loadFixture(deployMiniBankFixture);
      const aAmount = ethers.parseEther("1");
      const bAmount = ethers.parseEther("3");

      await bank.connect(alice).deposit({ value: aAmount });
      await bank.connect(bob).deposit({ value: bAmount });

      expect(await bank.getBalanceOf(alice.address)).to.equal(aAmount);
      expect(await bank.getBalanceOf(bob.address)).to.equal(bAmount);
      expect(await bank.getTotalBalance()).to.equal(aAmount + bAmount);
    });
  });
});

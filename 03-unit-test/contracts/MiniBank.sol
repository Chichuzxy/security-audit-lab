// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 演示用的小银行合约（用于单元测试教学）
// 功能：存款、取款、查询余额，带 Deposit/Withdraw 事件
contract MiniBank {
    address public owner;
    mapping(address => uint256) public balances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // 存款
    function deposit() public payable {
        require(msg.value > 0, "amount must > 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    // 取款（CEI 模式）
    function withdraw(uint256 amount) public {
        require(amount > 0, "amount must > 0");
        require(balances[msg.sender] >= amount, "insufficient balance");

        balances[msg.sender] -= amount; // 先记账
        (bool success, ) = msg.sender.call{value: amount}(""); // 再转账
        require(success, "transfer failed");
        emit Withdraw(msg.sender, amount);
    }

    // 查询某地址余额
    function getBalanceOf(address user) public view returns (uint256) {
        return balances[user];
    }

    // 查询合约总余额
    function getTotalBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 修复版银行合约（CEI 模式）
// CEI = Checks（检查）- Effects（改状态）- Interactions（交互）
// 修复：把 balances[msg.sender] = 0 移到转账【之前】
contract SafeBank {
    mapping(address => uint256) public balances;

    // 存款
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // 取款：修复版
    // 顺序改为：检查 -> 改状态 -> 转账
    function withdraw() public {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "no balance"); // Checks：检查

        balances[msg.sender] = 0; // Effects：先记账（清零）

        (bool success, ) = msg.sender.call{value: bal}(""); // Interactions：再转账
        require(success, "transfer failed");
    }

    // 查余额
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

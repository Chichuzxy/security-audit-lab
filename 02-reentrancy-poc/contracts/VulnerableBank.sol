// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 易受重入攻击的银行合约（有漏洞版）
// 漏洞：withdraw 先转账后改余额（先 Interactions 后 Effects）
contract VulnerableBank {
    mapping(address => uint256) public balances;

    // 存款
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // 取款：漏洞在这里！
    // 顺序是：检查余额 -> 转账 -> 更新余额
    // 转账时会触发攻击者的 receive()，攻击者可以在 receive() 里再次调用 withdraw()
    // 而此时 balances 还没更新，还能再取一次
    function withdraw() public {
        uint256 bal = balances[msg.sender];
        require(bal > 0, "no balance");

        (bool success, ) = msg.sender.call{value: bal}(""); // 先转账（交互）
        require(success, "transfer failed");

        balances[msg.sender] = 0; // 后改状态（记账）—— 太晚了！
    }

    // 查看合约余额
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

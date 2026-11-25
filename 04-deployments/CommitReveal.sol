// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CommitReveal 简化版
/// @notice 先提交答案哈希(commit)，后公开答案(reveal)，防止先手抄袭。
///         场景：AgentAudit 里审计报告提交防抄袭 / 猜谜游戏 / 投票前锁定立场。
///         类比：考试先交卷但密封，全部交完再统一开封。
///         机制：commit 存 keccak256(答案 + salt)，reveal 时验证对得上。
contract CommitReveal {
    // commit 阶段窗口（从部署起的块数），超过就不能再提交
    uint256 public constant COMMIT_WINDOW = 50;
    // reveal 阶段窗口（commit 结束后的块数），超过视为放弃（作废）
    uint256 public constant REVEAL_WINDOW = 50;

    uint256 public immutable startBlock; // 部署时的块高，阶段计时从这开始

    // 参与者 -> 提交的哈希（keccak256(abi.encodePacked(answer, salt))）
    mapping(address => bytes32) public commitments;
    // 参与者 -> 是否已 reveal（防止重复 reveal）
    mapping(address => bool) public revealed;

    event Committed(address indexed participant, bytes32 commitment);
    event Revealed(address indexed participant, string answer, bytes32 salt);

    constructor() {
        startBlock = block.number;
    }

    /// @dev Commit 阶段：提交答案的哈希。salt 随机数防止别人暴力猜答案。
    function commit(bytes32 commitment) external {
        require(block.number < startBlock + COMMIT_WINDOW, unicode"commit 阶段已结束");
        require(commitments[msg.sender] == bytes32(0), unicode"已提交过，不能重复提交");
        commitments[msg.sender] = commitment;
        emit Committed(msg.sender, commitment);
    }

    /// @dev Reveal 阶段：公开原始答案和随机数，合约验证哈希是否与 commit 一致。
    function reveal(string calldata answer, bytes32 salt) external {
        require(block.number >= startBlock + COMMIT_WINDOW, unicode"还没到 reveal 阶段");
        require(block.number < startBlock + COMMIT_WINDOW + REVEAL_WINDOW, unicode"reveal 阶段已结束，视为放弃");
        require(!revealed[msg.sender], unicode"已 reveal 过");

        bytes32 commitment = keccak256(abi.encodePacked(answer, salt));
        require(commitments[msg.sender] == commitment, unicode"答案与承诺不符");

        revealed[msg.sender] = true;
        emit Revealed(msg.sender, answer, salt);
    }

    /// @dev 查询某地址是否在 commit 阶段提交过
    function hasCommitted(address who) external view returns (bool) {
        return commitments[who] != bytes32(0);
    }
}

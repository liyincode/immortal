//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol"; 

/**
 * @title 不朽区块合约
 * @dev 存储每场比赛的结果。
 */
contract ImmortalBlock is Ownable {

    struct ImmortalRecord {
        uint256 matchId;                // 对应的比赛 ID
        address winner;                 // 胜利者地址
        string winnerName;              // 胜利者名称
        uint256 timestamp;              // 记录创建的时间戳
        string extraData;               // 额外数据 (例如 IPFS CID)
    }

    ImmortalRecord[] public immortalRecords;

    event BlockForged(
        uint256 indexed blockId,        // 新区块的 ID (即数组索引)
        uint256 indexed matchId,        // 比赛 ID
        address indexed winner,         // 胜利者地址
        string winnerName,
        uint256 timestamp
    );

    /**
     * @dev 设置合约所有者
     */
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    /**
     * @dev 记录比赛结果
     * @param _matchId 比赛ID
     * @param _winner 胜利者地址
     * @param _winnerName 胜利者名称
     * @param _extraData 额外数据 (例如 IPFS CID)
     */
    function forgeBlock(
        uint256 _matchId,
        address _winner,
        string calldata _winnerName, 
        string calldata _extraData  
    ) external onlyOwner { 
        require(_winner != address(0), "ImmortalBlock: Winner address cannot be zero.");

        uint256 blockId = immortalRecords.length;

        immortalRecords.push(ImmortalRecord({
            matchId: _matchId,
            winner: _winner,
            winnerName: _winnerName,
            timestamp: block.timestamp, 
            extraData: _extraData
        }));

        emit BlockForged(blockId, _matchId, _winner, _winnerName, block.timestamp);
    }

    /**
     * @dev 获取不朽区块数量
     * @return 不朽区块数量
     */
    function getRecordsCount() public view returns (uint256) {
        return immortalRecords.length;
    }

    /**
     * @dev 获取不朽区块
     * @param _blockId 区块ID
     * @return 不朽区块
     */
    function getRecordById(uint256 _blockId) public view returns (ImmortalRecord memory) {
        require(_blockId < immortalRecords.length, "ImmortalBlock: Invalid block ID.");
        return immortalRecords[_blockId];
    }

    /**
     * @dev 获取最近的N个不朽区块
     * @param _limit 返回的最近记录数量
     * @return 不朽区块数组
     */
    function getRecentRecords(uint256 _limit) public view returns (ImmortalRecord[] memory) {
        uint256 count = immortalRecords.length;
        if (_limit == 0) {
            return new ImmortalRecord[](0);
        }
        // 如果请求的数量超过实际数量，则返回所有记录
        uint256 numToReturn = _limit > count ? count : _limit;

        ImmortalRecord[] memory recent = new ImmortalRecord[](numToReturn);
        for (uint256 i = 0; i < numToReturn; i++) {
            // 从最新的记录开始取 (count - 1 是最新，count - numToReturn 是第 numToReturn 个最新的)
            recent[i] = immortalRecords[count - 1 - i];
        }
        return recent;
    }
}

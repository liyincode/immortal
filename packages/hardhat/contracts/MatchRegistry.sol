// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title 比赛报名合约
 * @dev 开启关闭报名，接受用户报名，获取报名列表。
 */
contract MatchRegistry is Ownable {

    // --- 状态变量 ---

    // 当前比赛ID
    uint256 public currentMatchId;      
    // 报名是否开启
    bool public registrationOpen;       

    // 每场比赛的报名列表
    // 映射：比赛ID => 报名地址 => 是否报名，用于快速检查某个地址是否报名
    mapping(uint256 => mapping(address => bool)) public isCandidateForMatch;
    // 映射：比赛ID => 报名地址列表，用于获取报名列表
    mapping(uint256 => address[]) internal _candidatesForMatch;

    // --- 事件 ---

    event RegistrationOpened(uint256 indexed matchId, uint256 openedAtTimestamp);
    event RegistrationClosed(uint256 indexed matchId, uint256 closedAtTimestamp);
    event FighterRegistered(uint256 indexed matchId, address indexed fighter, uint256 registrationTime);

    // --- 构造函数 ---

    constructor(address _initialOwner) Ownable(_initialOwner) {
        currentMatchId = 0; // 初始化为无比赛
        registrationOpen = false;
    }

    // --- 所有者函数 ---

    /**
     * @dev 为新的比赛开启报名
     * 增加currentMatchId并开启报名
     */
    function openNewMatchRegistration() external onlyOwner {
        // 如果之前报名是开启的，则关闭
        if (registrationOpen && currentMatchId > 0) {
             emit RegistrationClosed(currentMatchId, block.timestamp);
        }
        
        // 开启新的比赛报名
        currentMatchId++; 
        registrationOpen = true;

        // 清除新matchId的报名列表
        delete _candidatesForMatch[currentMatchId];

        emit RegistrationOpened(currentMatchId, block.timestamp);
    }

    /**
     * @dev 关闭当前比赛的报名
     */
    function closeCurrentMatchRegistration() external onlyOwner {
        require(currentMatchId > 0, "MatchRegistry: No match has been opened yet.");
        require(registrationOpen, "MatchRegistry: Registration is already closed for the current match.");
        
        registrationOpen = false;
        emit RegistrationClosed(currentMatchId, block.timestamp);
    }

    // --- 公共/外部函数 ---

    /**
     * @dev 用户报名
     */
    function registerAsFighter() external { 
        require(currentMatchId > 0, "MatchRegistry: No match is currently open for registration.");
        require(registrationOpen, "MatchRegistry: Registration is currently closed.");
        
        // 检查是否已经报名
        require(
            !isCandidateForMatch[currentMatchId][msg.sender],
            "MatchRegistry: You are already registered for this match."
        );

        // 设置报名状态
        isCandidateForMatch[currentMatchId][msg.sender] = true;
        _candidatesForMatch[currentMatchId].push(msg.sender);

        emit FighterRegistered(currentMatchId, msg.sender, block.timestamp);
    }

    // --- 视图函数 ---

    /**
     * @dev 获取当前比赛ID的报名列表
     * @return 报名地址列表
     */
    function getCurrentCandidatePool() external view returns (address[] memory) {
        if (currentMatchId == 0) {
            return new address[](0);
        }
        return _candidatesForMatch[currentMatchId];
    }

    /**
     * @dev 获取特定比赛ID的报名列表
     * @param _matchId 比赛ID
     * @return 该比赛的报名地址列表
     */
    function getCandidatePoolForMatch(uint256 _matchId) external view returns (address[] memory) {
        return _candidatesForMatch[_matchId];
    }

    /**
     * @dev 检查用户是否报名了某个比赛
     * @param _matchId 比赛ID
     * @param _candidate 要检查的地址
     * @return 如果报名了，则为true，否则为false
     */
    function isCandidate(uint256 _matchId, address _candidate) external view returns (bool) {
        return isCandidateForMatch[_matchId][_candidate];
    }
}

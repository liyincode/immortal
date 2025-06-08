//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title 观众管理合约
 * @dev 管理特定比赛的观众席位、入座以及观众为特定选手的加油热力值。
 * 座位ID从1开始，0代表未占座。
 */
contract AudienceManager is Ownable {

    // --- 常量 ---
    uint256 public constant TOTAL_SEATS = 50; // 每场比赛的座位总数
    uint256 internal constant NO_SEAT = 0;    // 0 代表用户未选择任何座位 (座位ID从1开始)

    // --- 数据结构 ---

    // 映射1: seatOccupants[比赛ID][内部座位索引 (0 to TOTAL_SEATS-1)] => 占用者地址
    mapping(uint256 => mapping(uint256 => address)) public seatOccupants;

    // 映射2: userCurrentSeat[比赛ID][用户地址] => 用户占用的座位ID (1-indexed, 或 NO_SEAT(0))
    mapping(uint256 => mapping(address => uint256)) public userCurrentSeat;

    // 映射3: fighterAudienceHeat[比赛ID][选手地址][观众地址] => 观众为该选手贡献的热力值
    mapping(uint256 => mapping(address => mapping(address => uint256))) public fighterAudienceHeat;

    // 映射4: activeFightersInMatch[比赛ID] => [选手A地址, 选手B地址]
    // 用于验证加油目标是否为当前比赛的合法选手。由Owner或MatchContract设置。
    mapping(uint256 => address[2]) public activeFightersInMatch;

    // --- 事件 ---
    event SeatTaken(uint256 indexed matchId, uint256 indexed seatId, address indexed user, uint256 timestamp);
    event SeatLeft(uint256 indexed matchId, uint256 indexed seatId, address indexed user, uint256 timestamp);
    event ActiveFightersSet(uint256 indexed matchId, address player1, address player2, uint256 timestamp);
    event FighterCheered(
        uint256 indexed matchId,
        address indexed fighterCheeredFor,
        address indexed audienceMember,
        uint256 newTotalHeatForThisPairing, // 该观众为该选手贡献的总热力
        uint256 cheerAmount,                // 本次加油点数
        uint256 timestamp
    );

    // --- 构造函数 ---
    constructor(address _initialOwner) Ownable(_initialOwner) {}

    // --- Owner专属函数 ---
    /**
     * @dev 设置某场比赛的活跃对战选手。应在比赛正式开始前由管理员或主比赛合约调用。
     * @param _matchId 比赛ID。
     * @param _player1 选手1的地址。
     * @param _player2 选手2的地址。
     */
    function setActiveFighters(uint256 _matchId, address _player1, address _player2) external onlyOwner {
        require(_matchId > 0, "AudienceManager: Invalid matchId");
        require(_player1 != address(0) && _player2 != address(0), "AudienceManager: Player address cannot be empty");
        require(_player1 != _player2, "AudienceManager: Two player addresses cannot be the same");

        activeFightersInMatch[_matchId] = [_player1, _player2];
        emit ActiveFightersSet(_matchId, _player1, _player2, block.timestamp);
    }


    // --- 修改状态的函数 ---

    /**
     * @dev 用户为指定比赛选择并占据一个座位。
     * @param _matchId 要加入的比赛ID。
     * @param _seatIdFromFrontend 要选择的座位ID (1 到 TOTAL_SEATS)。
     */
    function takeSeat(uint256 _matchId, uint256 _seatIdFromFrontend) external {
        address _user = msg.sender;
        require(_matchId > 0, "AudienceManager: Invalid matchId");
        require(_seatIdFromFrontend > 0 && _seatIdFromFrontend <= TOTAL_SEATS, "AudienceManager: Invalid seatId");
        require(userCurrentSeat[_matchId][_user] == NO_SEAT, "AudienceManager: You have already taken a seat");

        uint256 internalSeatIndex = _seatIdFromFrontend - 1;
        require(seatOccupants[_matchId][internalSeatIndex] == address(0), "AudienceManager: This seat is already occupied");

        seatOccupants[_matchId][internalSeatIndex] = _user;
        userCurrentSeat[_matchId][_user] = _seatIdFromFrontend;

        emit SeatTaken(_matchId, _seatIdFromFrontend, _user, block.timestamp);
    }

    /**
     * @dev 用户离开当前在指定比赛中占据的座位。
     * @param _matchId 比赛ID。
     */
    function leaveSeat(uint256 _matchId) external {
        address _user = msg.sender;
        require(_matchId > 0, "AudienceManager: Invalid matchId");
        uint256 currentSeatIdFromFrontend = userCurrentSeat[_matchId][_user];
        require(currentSeatIdFromFrontend != NO_SEAT, "AudienceManager: You are not in a seat");
        
        uint256 internalSeatIndex = currentSeatIdFromFrontend - 1;
        require(seatOccupants[_matchId][internalSeatIndex] == _user, "AudienceManager: You are not the occupant of this seat");

        seatOccupants[_matchId][internalSeatIndex] = address(0);
        userCurrentSeat[_matchId][_user] = NO_SEAT;

        emit SeatLeft(_matchId, currentSeatIdFromFrontend, _user, block.timestamp);
    }

    /**
     * @dev 观众为指定比赛中的指定选手加油，增加该选手获得的热力值。
     * @param _matchId 比赛ID。
     * @param _fighterToCheerFor 要为其加油的选手地址。
     * @param _cheerPoints 本次加油增加的热力点数。
     */
    function cheerForFighter(uint256 _matchId, address _fighterToCheerFor, uint256 _cheerPoints) external {
        address _audienceMember = msg.sender;
        require(_matchId > 0, "AudienceManager: Invalid matchId");
        require(_cheerPoints > 0, "AudienceManager: Cheer points must be greater than 0");
        require(userCurrentSeat[_matchId][_audienceMember] != NO_SEAT, "AudienceManager: You need to take a seat first");

        // 验证加油目标是否为本场比赛的合法选手
        address[2] memory currentFighters = activeFightersInMatch[_matchId];
        require(currentFighters[0] != address(0) && currentFighters[1] != address(0), "AudienceManager: The fighters for this match have not been set");
        require(
            _fighterToCheerFor == currentFighters[0] || _fighterToCheerFor == currentFighters[1],
            "AudienceManager: The target for cheering is not a valid fighter for this match"
        );

        uint256 currentHeat = fighterAudienceHeat[_matchId][_fighterToCheerFor][_audienceMember];
        uint256 newHeat = currentHeat + _cheerPoints;

        fighterAudienceHeat[_matchId][_fighterToCheerFor][_audienceMember] = newHeat;

        emit FighterCheered(_matchId, _fighterToCheerFor, _audienceMember, newHeat, _cheerPoints, block.timestamp);
    }

    // --- 只读 (View) 函数 ---

    /**
     * @dev 获取指定座位上的占用者地址。
     * @param _matchId 比赛ID。
     * @param _seatIdFromFrontend 要检查的座位ID (1 到 TOTAL_SEATS)。
     * @return 占用者地址。
     */
    function getSeatOccupant(uint256 _matchId, uint256 _seatIdFromFrontend) external view returns (address) {
        require(_seatIdFromFrontend > 0 && _seatIdFromFrontend <= TOTAL_SEATS, "AudienceManager: Invalid seatId");
        return seatOccupants[_matchId][_seatIdFromFrontend - 1];
    }

    /**
     * @dev 获取指定用户在指定比赛中的座位ID。
     * @param _matchId 比赛ID。
     * @param _user 用户地址。
     * @return 用户占用的座位ID (1-indexed, 或 NO_SEAT(0))。
     */
    function getUserSeatId(uint256 _matchId, address _user) external view returns (uint256) {
        return userCurrentSeat[_matchId][_user];
    }

    /**
     * @dev 获取指定观众为指定比赛中的指定选手贡献的总热力值。
     * @param _matchId 比赛ID。
     * @param _fighter 选手地址。
     * @param _audienceMember 观众地址。
     * @return uint256 热力值。
     */
    function getAudienceHeatForFighter(uint256 _matchId, address _fighter, address _audienceMember) external view returns (uint256) {
        return fighterAudienceHeat[_matchId][_fighter][_audienceMember];
    }

    /**
     * @dev 获取指定比赛ID的两位活跃选手地址。
     * @param _matchId 比赛ID。
     * @return address[2] memory 包含两位选手地址的数组; 如果未设置则地址为 address(0)。
     */
    function getActiveFighters(uint256 _matchId) external view returns (address[2] memory) {
        return activeFightersInMatch[_matchId];
    }
    
    /**
     * @dev 获取指定比赛ID的已占用座位信息。
     * @param _matchId 比赛ID。
     * @return seatIds_ 已占用座位的ID数组 (1-indexed)。
     * @return occupants_ 已占用座位的占用者地址数组。
     */
    function getOccupiedSeatInfo(uint256 _matchId) external view returns (uint256[] memory seatIds_, address[] memory occupants_) {
        uint256 occupiedCount = 0;
        for (uint256 i = 0; i < TOTAL_SEATS; i++) {
            if (seatOccupants[_matchId][i] != address(0)) {
                occupiedCount++;
            }
        }
        if (occupiedCount == 0) {
            return (new uint256[](0), new address[](0));
        }
        seatIds_ = new uint256[](occupiedCount);
        occupants_ = new address[](occupiedCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < TOTAL_SEATS; i++) {
            if (seatOccupants[_matchId][i] != address(0)) {
                seatIds_[currentIndex] = i + 1; 
                occupants_[currentIndex] = seatOccupants[_matchId][i];
                currentIndex++;
                if (currentIndex == occupiedCount) {
                    break;
                }
            }
        }
        return (seatIds_, occupants_);
    }
}

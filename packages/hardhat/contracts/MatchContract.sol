// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

// 可选：导入其他合约的接口
// import "./IImmortalBlock.sol"; // 假设你为 ImmortalBlock 创建了接口
// import "./IAudienceManager.sol"; // 假设你为 AudienceManager 创建了接口

contract MatchContract is Ownable {
    // --- 常量 ---
    uint8 public constant TOTAL_QUESTIONS = 10; // 每场比赛的总题目数量
    uint256 public constant ANSWER_TIMEOUT_DURATION = 60 seconds; // 每题回答时限（例如60秒）
    uint8 public constant MAX_CONSECUTIVE_WRONG_ANSWERS_FOR_REPLACEMENT = 3; // 触发替换的连续答错次数

    // --- 依赖合约地址 ---
    address public immortalBlockContractAddress;
    address public audienceManagerContractAddress;
    address public refereeAddress; // “AI裁判”或有权提交比赛结果的管理员地址

    // --- 数据结构 ---
    struct PlayerMatchState {
        address playerAddress;
        uint256 score;
        uint8 consecutiveWrongAnswers;
        bool isActive; // 标记选手是否仍在场上
    }

    enum MatchStatus {
        NotStarted, // 比赛尚未创建或初始化 (默认状态)
        AwaitingFirstQuestion, // 选手已确定，等待第一题开始 (可选状态)
        InProgress, // 比赛进行中，选手正在答题
        PlayerAReplaceable, // A选手达到可被替换条件
        PlayerBReplaceable, // B选手达到可被替换条件
        Concluded // 比赛已结束
    }

    struct Match {
        uint256 matchId;
        PlayerMatchState playerA;
        PlayerMatchState playerB;
        uint8 currentQuestionIndex;
        address currentPlayerTurn;
        uint256 currentQuestionDeadline;
        MatchStatus status;
        address winner;
    }

    mapping(uint256 => Match) public matches;

    // --- 事件 ---
    event MatchStarted(
        uint256 indexed matchId,
        address indexed playerA,
        address indexed playerB,
        address firstPlayerTurn, // 谁先手
        uint256 startTime,
        uint256 firstQuestionDeadline
    );
    // ... (其他事件保持不变)
    event AnswerResultSubmitted(
        uint256 indexed matchId,
        uint256 indexed questionIndex,
        address indexed player,
        bool isCorrect,
        uint256 newScorePlayerA,
        uint256 newScorePlayerB
    );
    event PlayerTurnAdvanced(
        uint256 indexed matchId,
        uint256 nextQuestionIndex,
        address nextPlayerTurn,
        uint256 newDeadline
    );
    event PlayerBecameReplaceable(uint256 indexed matchId, address indexed playerAddress, uint8 consecutiveWrong);
    event PlayerReplaced(uint256 indexed matchId, address indexed oldPlayer, address indexed newPlayer);
    event MatchConcluded(
        uint256 indexed matchId,
        address indexed winner,
        uint256 finalScorePlayerA,
        uint256 finalScorePlayerB
    );

    // --- 构造函数 ---
    constructor(
        address _initialOwner,
        address _immortalBlockAddr,
        address _audienceManagerAddr,
        address _refereeAddr
    ) Ownable(_initialOwner) {
        require(_immortalBlockAddr != address(0), "MatchContract: Invalid immortal block contract address");
        require(_audienceManagerAddr != address(0), "MatchContract: Invalid audience manager contract address");
        require(_refereeAddr != address(0), "MatchContract: Invalid referee address");

        immortalBlockContractAddress = _immortalBlockAddr;
        audienceManagerContractAddress = _audienceManagerAddr;
        refereeAddress = _refereeAddr;
    }

    // --- 修饰符 ---
    modifier onlyReferee() {
        require(msg.sender == refereeAddress, "MatchContract: Caller is not the authorized referee");
        _;
    }

    // --- Owner专属函数 (用于设置和更新关键地址) ---
    function setImmortalBlockContract(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "MatchContract: Invalid immortal block contract address");
        immortalBlockContractAddress = _newAddress;
    }

    function setAudienceManagerContract(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "MatchContract: Invalid audience manager contract address");
        audienceManagerContractAddress = _newAddress;
    }

    function setRefereeAddress(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "MatchContract: Invalid referee address");
        refereeAddress = _newAddress;
    }

    // --- 核心功能函数 ---

    /**
     * @dev 由管理员调用，用于初始化并开始一场新的比赛。
     * @param _matchId 比赛ID，应与 MatchRegistry 中生成的一致。
     * @param _playerA 选手A的地址。
     * @param _playerB 选手B的地址。
     */
    function startMatch(uint256 _matchId, address _playerA, address _playerB) external onlyOwner {
        // 权限：只有合约拥有者（管理员）可以开始比赛
        // 检查1：输入参数有效性
        require(_matchId > 0, "MatchContract: MatchId must be greater than 0");
        require(_playerA != address(0) && _playerB != address(0), "MatchContract: Player address cannot be empty");
        require(_playerA != _playerB, "MatchContract: Two player addresses cannot be the same");

        // 检查2：确保该 matchId 的比赛尚未开始或不存在
        // Match 结构体的默认状态 status 会是 0 (即 NotStarted)
        // 同时检查 playerA 地址是否为0，也能判断是否已被初始化
        Match storage existingMatch = matches[_matchId];
        require(
            existingMatch.playerA.playerAddress == address(0) && existingMatch.status == MatchStatus.NotStarted,
            "MatchContract: The matchId already exists or has started"
        );

        // 初始化比赛数据
        Match storage newMatch = matches[_matchId]; // 获取存储指针
        newMatch.matchId = _matchId;

        newMatch.playerA.playerAddress = _playerA;
        newMatch.playerA.score = 0;
        newMatch.playerA.consecutiveWrongAnswers = 0;
        newMatch.playerA.isActive = true;

        newMatch.playerB.playerAddress = _playerB;
        newMatch.playerB.score = 0;
        newMatch.playerB.consecutiveWrongAnswers = 0;
        newMatch.playerB.isActive = true;

        newMatch.currentQuestionIndex = 0; // 从第0题开始 (代表第一题)
        newMatch.currentPlayerTurn = _playerA; // V1版本，默认选手A先手
        newMatch.currentQuestionDeadline = block.timestamp + ANSWER_TIMEOUT_DURATION; // 设置第一题的回答截止时间

        newMatch.status = MatchStatus.InProgress; // 将比赛状态设置为进行中
        newMatch.winner = address(0); // 初始化胜利者为空地址

        // 关于通知 AudienceManager 合约当前活跃选手：
        // 如前所述，V1简化版中，此操作将由管理员在调用 startMatch 后，
        // 再另行调用 AudienceManager 合约的 setActiveFighters 函数来完成。
        // 若要在此合约内直接调用，需要 AudienceManager 提供相应权限或接口。
        // 例如:
        // IAudienceManager(audienceManagerContractAddress).setActiveFighters(_matchId, _playerA, _playerB);
        // 但这要求 AudienceManager 的 setActiveFighters 允许本合约调用。

        // 触发比赛开始事件
        emit MatchStarted(
            _matchId,
            _playerA,
            _playerB,
            newMatch.currentPlayerTurn, // 明确谁先手
            block.timestamp, // 比赛正式开始的时间戳
            newMatch.currentQuestionDeadline
        );
    }

    // --- 内部函数 ---
    /**
     * @dev 内部函数，用于结束比赛，判定胜者，并记录到不朽链。
     * @param _matchId 要结束的比赛ID。
     */
    function _concludeMatch(uint256 _matchId) internal {
        Match storage concludedMatch = matches[_matchId];

        // 防止重复结束
        require(concludedMatch.status != MatchStatus.Concluded, "MatchContract: Match already concluded");

        address winningPlayer;
        if (concludedMatch.playerA.score > concludedMatch.playerB.score) {
            winningPlayer = concludedMatch.playerA.playerAddress;
        } else if (concludedMatch.playerB.score > concludedMatch.playerA.score) {
            winningPlayer = concludedMatch.playerB.playerAddress;
        } else {
            winningPlayer = address(0); // 平局
        }

        concludedMatch.winner = winningPlayer;
        concludedMatch.status = MatchStatus.Concluded;

        emit MatchConcluded(_matchId, winningPlayer, concludedMatch.playerA.score, concludedMatch.playerB.score);

        // 调用不朽链合约记录结果
        // 假设 ImmortalBlock.sol 有一个函数 forgeBlock(uint256 matchId, address winner, uint256 scoreA, uint256 scoreB)
        // 并且本合约地址被授权调用它（例如 ImmortalBlock 也 Ownable，且 owner 是同一个人，或者 ImmortalBlock 有授权机制）
        // 为了V1简化，我们假设 ImmortalBlock 的 forgeBlock 可以被任何人调用，或者是由本合约 Owner 后期手动整理数据调用。
        // 如果要直接调用，需要定义接口 IImmortalBlock
        // IImmortalBlock(immortalBlockContractAddress).forgeBlock(_matchId, winningPlayer, ...);
        // 为简单起见，V1版本中，MatchContract仅发出事件，实际写入ImmortalBlock可由管理员根据事件链下触发，
        // 或者我们假设有一个简单的 forgeBlock 接口。
        // 我们先专注于 MatchContract 的逻辑。与 ImmortalBlock 的交互可以后续细化。
        // 例如，可以简单地尝试调用，如果失败，事件仍然发出，数据仍在 MatchContract 中。

        // 示例：尝试调用一个简化的 ImmortalBlock 函数
        // function recordVictory(uint256 _mId, address _winAddr) external;
        // (bool success, ) = immortalBlockContractAddress.call(
        //     abi.encodeWithSignature("recordVictory(uint256,address)", _matchId, winningPlayer)
        // );
        // if (!success) {
        //     // 可选：发出一个调用失败的事件或日志
        //     console.log("Failed to record victory on ImmortalBlock for match %s", _matchId);
        // }
    }

    /**
     * @dev 由裁判调用，提交选手对当前问题的回答结果。
     * 即使选手进入可替换状态，比赛也会继续进行。
     * @param _matchId 比赛ID。
     * @param _playerWhoAnswered 回答问题的选手地址。
     * @param _questionIndex 回答的问题索引。
     * @param _isCorrect 回答是否正确。
     */
    function submitAnswerResult(
        uint256 _matchId,
        address _playerWhoAnswered,
        uint256 _questionIndex,
        bool _isCorrect
    ) public {
        Match storage currentMatch = matches[_matchId];

        // --- 验证阶段 ---
        require(currentMatch.matchId == _matchId, "MatchContract: Match not initialized or ID mismatch.");
        // 比赛状态可以是 InProgress, PlayerAReplaceable, 或 PlayerBReplaceable，都允许提交答案
        require(
            currentMatch.status == MatchStatus.InProgress ||
                currentMatch.status == MatchStatus.PlayerAReplaceable ||
                currentMatch.status == MatchStatus.PlayerBReplaceable,
            "MatchContract: Match is not in a playable state." // 英文提示：比赛未处于可进行状态
        );
        require(
            _questionIndex == currentMatch.currentQuestionIndex,
            "MatchContract: Submitted result is for an outdated or future question index."
        );
        require(
            _playerWhoAnswered == currentMatch.currentPlayerTurn,
            "MatchContract: It's not this player's turn to answer."
        );

        // --- 获取选手状态存储指针 ---
        PlayerMatchState storage answeringPlayerState;
        PlayerMatchState storage opponentPlayerState;

        if (_playerWhoAnswered == currentMatch.playerA.playerAddress) {
            answeringPlayerState = currentMatch.playerA;
            opponentPlayerState = currentMatch.playerB;
        } else if (_playerWhoAnswered == currentMatch.playerB.playerAddress) {
            answeringPlayerState = currentMatch.playerB;
            opponentPlayerState = currentMatch.playerA;
        } else {
            revert("MatchContract: Player who answered is not part of this match.");
        }

        // --- 更新选手答题状态 ---
        if (_isCorrect) {
            answeringPlayerState.score++;
            answeringPlayerState.consecutiveWrongAnswers = 0;
            // 如果选手之前处于可替换状态，但现在答对了，可以将比赛状态恢复为 InProgress
            // （前提是对手也不是可替换状态）
            if (
                (currentMatch.status == MatchStatus.PlayerAReplaceable &&
                    _playerWhoAnswered == currentMatch.playerA.playerAddress) ||
                (currentMatch.status == MatchStatus.PlayerBReplaceable &&
                    _playerWhoAnswered == currentMatch.playerB.playerAddress)
            ) {
                // 检查对手状态，只有当对手也不是Replaceable时才恢复为InProgress
                bool opponentIsReplaceable = (_playerWhoAnswered == currentMatch.playerA.playerAddress &&
                    currentMatch.status == MatchStatus.PlayerBReplaceable) ||
                    (_playerWhoAnswered == currentMatch.playerB.playerAddress &&
                        currentMatch.status == MatchStatus.PlayerAReplaceable);
                if (!opponentIsReplaceable) {
                    currentMatch.status = MatchStatus.InProgress;
                }
            }
        } else {
            // 回答错误
            answeringPlayerState.consecutiveWrongAnswers++;
            if (answeringPlayerState.consecutiveWrongAnswers >= MAX_CONSECUTIVE_WRONG_ANSWERS_FOR_REPLACEMENT) {
                // 即使状态已经是 PlayerAReplaceable/PlayerBReplaceable，再次触发事件也无妨，表明又错了一次
                if (_playerWhoAnswered == currentMatch.playerA.playerAddress) {
                    currentMatch.status = MatchStatus.PlayerAReplaceable;
                } else {
                    currentMatch.status = MatchStatus.PlayerBReplaceable;
                }
                emit PlayerBecameReplaceable(
                    _matchId,
                    _playerWhoAnswered,
                    answeringPlayerState.consecutiveWrongAnswers
                );
            }
        }

        // --- 触发答案提交事件 ---
        uint256 scoreA_afterUpdate = currentMatch.playerA.score;
        uint256 scoreB_afterUpdate = currentMatch.playerB.score;

        emit AnswerResultSubmitted(
            _matchId,
            _questionIndex,
            _playerWhoAnswered,
            _isCorrect,
            scoreA_afterUpdate,
            scoreB_afterUpdate
        );

        // --- 推进比赛状态到下一题/下一位选手 (不再有提前 return 的暂停逻辑) ---
        currentMatch.currentQuestionIndex++;

        if (currentMatch.currentQuestionIndex >= TOTAL_QUESTIONS) {
            _concludeMatch(_matchId); // 调用内部函数结束比赛
            return; // 比赛结束
        }

        // 切换到另一位选手答题
        if (currentMatch.currentPlayerTurn == currentMatch.playerA.playerAddress) {
            currentMatch.currentPlayerTurn = currentMatch.playerB.playerAddress;
        } else {
            currentMatch.currentPlayerTurn = currentMatch.playerA.playerAddress;
        }

        // 为新题目和新选手设置回答截止时间
        currentMatch.currentQuestionDeadline = block.timestamp + ANSWER_TIMEOUT_DURATION;

        emit PlayerTurnAdvanced(
            _matchId,
            currentMatch.currentQuestionIndex,
            currentMatch.currentPlayerTurn,
            currentMatch.currentQuestionDeadline
        );
    }

    /**
     * @dev 由管理员调用，用一名新选手替换场上当前处于可替换状态的选手。
     * 新选手将继承被替换选手的得分，但连续答错次数重置为0。
     * 比赛状态将恢复为 InProgress。
     * @param _matchId 比赛ID。
     * @param _playerToReplace 将被替换的场上选手的地址。
     * @param _newPlayer 将上场替换的新选手的地址（原观众）。
     */
    function replacePlayer(uint256 _matchId, address _playerToReplace, address _newPlayer) external onlyOwner {
        // 只有合约拥有者（管理员）可以执行此操作
        Match storage currentMatch = matches[_matchId];

        // --- 验证阶段 ---
        require(currentMatch.matchId == _matchId, "MatchContract: Match not initialized or ID mismatch."); // 英文提示
        require(
            currentMatch.status == MatchStatus.PlayerAReplaceable ||
                currentMatch.status == MatchStatus.PlayerBReplaceable,
            "MatchContract: Match is not in a state where a player can be replaced." // 英文提示
        );
        require(
            _playerToReplace != address(0) && _newPlayer != address(0),
            "MatchContract: Player addresses cannot be zero."
        ); // 英文提示
        require(
            _playerToReplace != _newPlayer,
            "MatchContract: New player cannot be the same as the one being replaced."
        ); // 英文提示

        PlayerMatchState storage playerStateToUpdate;
        address opponentAddress;

        // 确认 _playerToReplace 是哪位选手，并获取其状态存储指针
        if (currentMatch.status == MatchStatus.PlayerAReplaceable) {
            require(
                _playerToReplace == currentMatch.playerA.playerAddress,
                "MatchContract: Player to replace does not match replaceable status (expected Player A)."
            ); // 英文提示
            playerStateToUpdate = currentMatch.playerA;
            opponentAddress = currentMatch.playerB.playerAddress;
        } else {
            // currentMatch.status == MatchStatus.PlayerBReplaceable
            require(
                _playerToReplace == currentMatch.playerB.playerAddress,
                "MatchContract: Player to replace does not match replaceable status (expected Player B)."
            ); // 英文提示
            playerStateToUpdate = currentMatch.playerB;
            opponentAddress = currentMatch.playerA.playerAddress;
        }

        // 确保新选手不是场上的另一位对手
        require(_newPlayer != opponentAddress, "MatchContract: New player is already the opponent."); // 英文提示

        // --- 执行替换 ---

        // 1. 标记旧选手不再活跃
        playerStateToUpdate.isActive = false;
        // 旧选手的得分和最终的连续答错次数保留在 playerStateToUpdate 中，作为历史记录。
        // 但由于 playerStateToUpdate 是一个 storage pointer，接下来我们会覆盖它的内容。
        // 如果需要保留旧选手的完整最终状态，需要先复制一份或有单独的存储。
        // V1简化：直接更新此槽位为新选手。

        // 2. 更新槽位为新选手的信息
        // （新选手继承得分，连续答错清零）
        if (_playerToReplace == currentMatch.playerA.playerAddress) {
            currentMatch.playerA = PlayerMatchState({
                playerAddress: _newPlayer,
                score: playerStateToUpdate.score, // 继承得分
                consecutiveWrongAnswers: 0, // 重置连续答错
                isActive: true
            });
        } else {
            currentMatch.playerB = PlayerMatchState({
                playerAddress: _newPlayer,
                score: playerStateToUpdate.score, // 继承得分
                consecutiveWrongAnswers: 0, // 重置连续答错
                isActive: true
            });
        }

        // 3. 更新比赛状态
        currentMatch.status = MatchStatus.InProgress;

        // 4. 处理当前回合和截止时间
        // 新选手上场，当前题目继续，但重置回答截止时间。
        // 回合归属：如果被替换的是当前答题者，则新选手接替回合；否则回合不变。
        if (currentMatch.currentPlayerTurn == _playerToReplace) {
            currentMatch.currentPlayerTurn = _newPlayer;
        }
        // 无论谁的回合，都重置当前问题的截止时间，给新局面一些准备
        currentMatch.currentQuestionDeadline = block.timestamp + ANSWER_TIMEOUT_DURATION;

        // 触发选手被替换事件
        emit PlayerReplaced(_matchId, _playerToReplace, _newPlayer);

        // 触发回合信息更新事件 (因为截止时间已变，当前答题人也可能已变)
        emit PlayerTurnAdvanced(
            _matchId,
            currentMatch.currentQuestionIndex, // 题目索引不变
            currentMatch.currentPlayerTurn,
            currentMatch.currentQuestionDeadline
        );
    }
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AudienceSeating } from "~~/components/AudienceSeating";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  audio: string;
}

interface PlayerAnswer {
  playerId: "A" | "B";
  questionId: number;
  selectedOption: number;
}

export default function BattlePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [scores, setScores] = useState({ A: 0, B: 0 });
  const [aiSpeech, setAiSpeech] = useState("🤖 正在出题中...");
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // AI 机器人的对话内容
  const aiPhrases = [
    "🤖 正在出题中...",
    "💭 让我们见证智慧的对决！",
    "⚡ 准备好接受挑战了吗？",
    "🔮 答案就在你的选择中...",
    "🎯 展示你的知识吧！",
    "🚀 谁将在不朽链上留名？",
  ];

  const hasPlayerAnswered = (playerId: "A" | "B", questionId: number) => {
    return playerAnswers.some(answer => answer.playerId === playerId && answer.questionId === questionId);
  };

  const getPlayerAnswer = (playerId: "A" | "B", questionId: number) => {
    const answer = playerAnswers.find(answer => answer.playerId === playerId && answer.questionId === questionId);
    return answer?.selectedOption;
  };

  // 获取新题目
  const fetchQuiz = async () => {
    setLoading(true);
    setAiSpeech("🤖 正在出题中...");
    try {
      const res = await fetch("/api/getQuiz");
      const data = await res.json();
      if (data && data.question && Array.isArray(data.options)) {
        // answer 可能是 "A"/"B"/"C"/"D"，转为索引
        const answerIdx =
          typeof data.answer === "string" ? ["A", "B", "C", "D"].indexOf(data.answer.trim().toUpperCase()) : 0;
        setQuestions(prev => [
          ...prev,
          {
            id: prev.length + 1,
            question: data.question,
            options: data.options.map((opt: string) => opt.replace(/^[A-D]\.\s*/, "")),
            correctAnswer: answerIdx,
            audio: data.audio,
          },
        ]);
        setAiSpeech("🤖 题目已出，请选手A和选手B开始答题...");
      }
    } catch {
      setAiSpeech("❌ 获取题目失败，请刷新重试");
    }
    setLoading(false);
  };

  // 首次加载获取第一题
  useEffect(() => {
    if (questions.length === 0) {
      fetchQuiz();
    }
    // eslint-disable-next-line
  }, []);

  // 自动播放音频
  useEffect(() => {
    if (questions[currentQuestion]?.audio && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [currentQuestion, questions]);

  const handlePlayerAnswer = (playerId: "A" | "B", selectedOption: number) => {
    const newAnswer: PlayerAnswer = {
      playerId,
      questionId: questions[currentQuestion].id,
      selectedOption,
    };

    setPlayerAnswers(prev => [...prev, newAnswer]);
    setAiSpeech(`🎯 选手 ${playerId} 已选择答案！`);

    const otherPlayerId = playerId === "A" ? "B" : "A";
    const otherPlayerAnswered = hasPlayerAnswered(otherPlayerId, questions[currentQuestion].id);

    if (otherPlayerAnswered) {
      setAiSpeech("⚡ 双方答题完毕！准备下一题...");
      setTimeout(async () => {
        if (currentQuestion < 4) {
          // 5题
          // 如果还没到5题，获取新题
          await fetchQuiz();
          setCurrentQuestion(prev => prev + 1);
          const randomPhrase = aiPhrases[Math.floor(Math.random() * aiPhrases.length)];
          setAiSpeech(randomPhrase);
        } else {
          setAiSpeech("🏆 比赛结束！正在计算最终结果...");
          calculateFinalScores();
        }
      }, 2000);
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    const playerAAnswer = getPlayerAnswer("A", questions[currentQuestion].id);
    const playerBAnswer = getPlayerAnswer("B", questions[currentQuestion].id);

    let className =
      "bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-center text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-105";

    if (playerAAnswer === optionIndex && playerBAnswer === optionIndex) {
      // 两个选手都选了这个选项 - 紫色
      className =
        "bg-purple-500/50 border border-purple-400 rounded-lg p-4 text-center text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-105";
    } else if (playerAAnswer === optionIndex) {
      // 选手 A 选择了这个选项 - 蓝色
      className =
        "bg-cyan-500/50 border border-cyan-400 rounded-lg p-4 text-center text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-105";
    } else if (playerBAnswer === optionIndex) {
      // 选手 B 选择了这个选项 - 红色
      className =
        "bg-red-500/50 border border-red-400 rounded-lg p-4 text-center text-lg font-medium cursor-pointer transition-all duration-300 hover:scale-105";
    }

    return className;
  };

  const handleOptionClick = (optionIndex: number) => {
    const currentQuestionId = questions[currentQuestion].id;
    const playerAAnswered = hasPlayerAnswered("A", currentQuestionId);
    const playerBAnswered = hasPlayerAnswered("B", currentQuestionId);

    // 如果选手 A 还没答题，点击给选手 A 答题
    if (!playerAAnswered) {
      handlePlayerAnswer("A", optionIndex);
    }
    // 如果选手 A 已答题但选手 B 还没答题，点击给选手 B 答题
    else if (!playerBAnswered) {
      handlePlayerAnswer("B", optionIndex);
    }
  };

  const calculateFinalScores = () => {
    let scoreA = 0;
    let scoreB = 0;

    questions.forEach(question => {
      const answerA = getPlayerAnswer("A", question.id);
      const answerB = getPlayerAnswer("B", question.id);

      if (answerA === question.correctAnswer) scoreA++;
      if (answerB === question.correctAnswer) scoreB++;
    });

    setScores({ A: scoreA, B: scoreB });
    setGameFinished(true);
  };

  const resetGame = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setPlayerAnswers([]);
    setGameFinished(false);
    setScores({ A: 0, B: 0 });
    fetchQuiz();
  };

  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            🏆 战斗结束！
          </motion.h1>

          <motion.div
            className="bg-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 mb-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6">最终得分</h2>
            <div className="flex justify-center gap-16">
              <motion.div
                className="text-center"
                initial={{ x: -50 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="text-6xl font-bold text-cyan-400">选手 A</div>
                <div className="text-4xl font-bold text-white mt-2">{scores.A}/5</div>
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="text-6xl font-bold text-red-400">选手 B</div>
                <div className="text-4xl font-bold text-white mt-2">{scores.B}/5</div>
              </motion.div>
            </div>

            <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {scores.A > scores.B ? (
                <div className="text-3xl font-bold text-cyan-400">🎉 选手 A 获胜！</div>
              ) : scores.B > scores.A ? (
                <div className="text-3xl font-bold text-red-400">🎉 选手 B 获胜！</div>
              ) : (
                <div className="text-3xl font-bold text-yellow-400">🤝 平局！</div>
              )}
            </motion.div>
          </motion.div>

          <motion.button
            onClick={resetGame}
            className="bg-gradient-to-r from-cyan-500 to-red-500 text-white px-8 py-4 rounded-lg text-xl font-bold transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            重新开始战斗
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CRT效果和网格背景 */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-30 vaporwave-crt-overlay"></div>
      <div className="fixed inset-0 -z-10 vaporwave-grid-bg"></div>
      <div className="">
        {questions[currentQuestion]?.audio && (
          <audio ref={audioRef} autoPlay>
            <source src={`data:audio/mpeg;base64,${questions[currentQuestion].audio}`} type="audio/mpeg" />
          </audio>
        )}
        <div className="max-w-7xl mx-auto">
          {/* 标题 */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-xl text-gray-300">题目 {currentQuestion + 1} / 5</div>
          </motion.div>

          {/* 主要游戏区域 - 三列布局 */}
          <div className="grid grid-cols-5 gap-8 mb-8">
            {/* 选手 A - 左侧 */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-6">
                {/* 选手 A 头像 */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-4 border-cyan-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-cyan-400/30"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🚀
                </motion.div>
                <div className="text-4xl font-bold text-cyan-400 mb-2">选手 A</div>
                <div className="text-sm text-gray-400">
                  已答题: {playerAnswers.filter(a => a.playerId === "A").length}/{questions.length}
                </div>
              </div>

              <div className="text-center">
                {hasPlayerAnswered("A", questions[currentQuestion]?.id) ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
                    <motion.div
                      className="text-lg text-green-400 mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      ✅ 已提交答案
                    </motion.div>
                    <div className="text-2xl font-bold text-cyan-400">
                      选择了: {String.fromCharCode(65 + getPlayerAnswer("A", questions[currentQuestion].id)!)}
                    </div>
                    {!hasPlayerAnswered("B", questions[currentQuestion].id) && (
                      <motion.div
                        className="text-sm text-gray-400 mt-2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        等待选手 B...
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="text-lg text-yellow-400 mb-4">🤔 思考中...</div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* 题目和选项区域 - 中间 */}
            {loading ? (
              <div className="col-span-3 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-8">
                <div className="text-center text-2xl text-yellow-400">🤖 正在获取题目...</div>
              </div>
            ) : (
              <motion.div
                className="col-span-3 bg-black/50 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* AI 机器人裁判 */}
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    {/* 简化的方块机器人 */}
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-b from-gray-600 to-gray-800 rounded-lg border-2 border-cyan-400 mx-auto mb-4 relative flex flex-col items-center justify-center"
                      animate={{
                        y: [0, -8, 0],
                        rotateY: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      {/* 机器人眼睛 */}
                      <div className="flex gap-2 mb-2">
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{
                            opacity: [1, 0.3, 1],
                            scale: [1, 0.8, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0,
                          }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{
                            opacity: [1, 0.3, 1],
                            scale: [1, 0.8, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.5,
                          }}
                        />
                      </div>

                      {/* 机器人嘴巴 */}
                      <motion.div
                        className="w-6 h-0.5 bg-yellow-400 rounded-full"
                        animate={{
                          width: [24, 16, 24],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>

                    {/* 机器人对话框 */}
                    <motion.div
                      className="absolute -top-16 -left-32 w-80 bg-black/90 text-cyan-400 text-sm p-3 rounded-lg border border-cyan-400/50"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        key={aiSpeech}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                      >
                        {aiSpeech}
                      </motion.div>
                      {/* 对话框箭头 */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-cyan-400/50"></div>
                    </motion.div>
                  </div>

                  <motion.h2
                    className="text-3xl font-bold mb-6 text-white bg-gradient-to-r from-cyan-400 to-yellow-400 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={currentQuestion}
                    transition={{ duration: 0.6 }}
                  >
                    {questions[currentQuestion]?.question}
                  </motion.h2>
                </div>

                <motion.div
                  className="grid grid-cols-2 gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {questions[currentQuestion]?.options.map((option, index) => (
                    <motion.div
                      key={index}
                      className={getOptionStyle(index)}
                      onClick={() => handleOptionClick(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <span className="text-yellow-400 font-bold">{String.fromCharCode(65 + index)}.</span> {option}
                    </motion.div>
                  ))}
                </motion.div>

                {/* 选择指示器 */}
                <motion.div
                  className="mt-6 flex justify-center gap-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-center">
                    <div className="text-cyan-400 font-bold">选手 A</div>
                    <div className="text-sm">
                      {hasPlayerAnswered("A", questions[currentQuestion]?.id)
                        ? `选择: ${String.fromCharCode(65 + getPlayerAnswer("A", questions[currentQuestion]?.id)!)}`
                        : "未选择"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold">选手 B</div>
                    <div className="text-sm">
                      {hasPlayerAnswered("B", questions[currentQuestion]?.id)
                        ? `选择: ${String.fromCharCode(65 + getPlayerAnswer("B", questions[currentQuestion]?.id)!)}`
                        : "未选择"}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* 选手 B - 右侧 */}
            <motion.div
              className="p-6"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-6">
                {/* 选手 B 头像 */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-pink-600 border-4 border-red-400 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-red-400/30"
                  animate={{
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  🎯
                </motion.div>
                <div className="text-4xl font-bold text-red-400 mb-2">选手 B</div>
                <div className="text-sm text-gray-400">
                  已答题: {playerAnswers.filter(a => a.playerId === "B").length}/{questions.length}
                </div>
              </div>

              <div className="text-center">
                {hasPlayerAnswered("B", questions[currentQuestion]?.id) ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
                    <motion.div
                      className="text-lg text-green-400 mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      ✅ 已提交答案
                    </motion.div>
                    <div className="text-2xl font-bold text-red-400">
                      选择了: {String.fromCharCode(65 + getPlayerAnswer("B", questions[currentQuestion]?.id)!)}
                    </div>
                    {!hasPlayerAnswered("A", questions[currentQuestion]?.id) && (
                      <motion.div
                        className="text-sm text-gray-400 mt-2"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        等待选手 A...
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="text-lg text-yellow-400 mb-4">🤔 思考中...</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* 进度条 */}
      <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-red-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-center mt-2 text-gray-400">进度: {currentQuestion + 1} / 5</div>
      </motion.div>

      {/* 观众席 */}
      <motion.div
        className="mt-16 mb-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <AudienceSeating />
      </motion.div>
    </>
  );
}

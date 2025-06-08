"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useMatchStore } from "~~/services/store/matchStore";

export function CandidatePoolDisplay() {
  const { candidatePool } = useMatchStore();

  // 选择状态管理
  const [isSelecting, setIsSelecting] = useState(false);
  const [spotlightTarget, setSpotlightTarget] = useState<number | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [finalSelection, setFinalSelection] = useState<number[]>([]);

  // 从智能合约读取真实的候选人列表
  const { data: contractCandidates, isLoading } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "getCurrentCandidatePool",
  });

  // 将区块链数据转换为显示格式
  const displayCandidates =
    contractCandidates?.map((address, index) => ({
      id: address,
      index: index,
      displayName: `${address.slice(0, 6)}...${address.slice(-4)}`, // 显示地址缩写
      avatarUrl: "👤", // 默认头像
    })) || [];

  // 开始选择动画
  const startSelection = async () => {
    if (candidatesToShow.length < 2) {
      alert("候选人数量不足，需要至少2人才能开始选择！");
      return;
    }

    setIsSelecting(true);
    setSelectedCandidates([]);
    setFinalSelection([]);
    setSpotlightTarget(null);

    // 第一阶段：随机聚光灯照射（持续3秒）
    const spotlightDuration = 3000;
    const spotlightInterval = 200;
    const spotlightCount = spotlightDuration / spotlightInterval;

    for (let i = 0; i < spotlightCount; i++) {
      const randomIndex = Math.floor(Math.random() * candidatesToShow.length);
      setSpotlightTarget(randomIndex);
      await new Promise(resolve => setTimeout(resolve, spotlightInterval));
    }

    // 第二阶段：选择第一个选手
    await new Promise(resolve => setTimeout(resolve, 500));
    const firstSelected = Math.floor(Math.random() * candidatesToShow.length);
    setSelectedCandidates([firstSelected]);
    setSpotlightTarget(firstSelected);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 第三阶段：选择第二个选手
    let secondSelected;
    do {
      secondSelected = Math.floor(Math.random() * candidatesToShow.length);
    } while (secondSelected === firstSelected);

    // 聚光灯在剩余候选人中随机移动
    for (let i = 0; i < 10; i++) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * candidatesToShow.length);
      } while (randomIndex === firstSelected);
      setSpotlightTarget(randomIndex);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setSelectedCandidates([firstSelected, secondSelected]);
    setSpotlightTarget(secondSelected);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 最终确认
    setFinalSelection([firstSelected, secondSelected]);
    setSpotlightTarget(null);
    setIsSelecting(false);
  };

  // 重置选择
  const resetSelection = () => {
    setIsSelecting(false);
    setSpotlightTarget(null);
    setSelectedCandidates([]);
    setFinalSelection([]);
  };

  // 如果正在加载
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-cyan-400 mt-3 text-lg">正在获取候选池数据...</p>
      </div>
    );
  }

  // 优先使用从区块链读取的数据，回退到本地状态
  const candidatesToShow =
    displayCandidates.length > 0
      ? displayCandidates
      : candidatePool?.map((candidate, index) => ({
          ...candidate,
          index: index,
        })) || [];

  if (candidatesToShow.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-cyan-400/50 rounded-2xl p-8 backdrop-blur-lg">
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-cyan-400 text-xl font-bold vaporwave-text-cyan">战场虚位以待</p>
          <p className="text-pink-400 mt-2 opacity-80">暂无勇士报名参战</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 relative">
      {/* 顶部区域 - 根据状态显示不同内容 */}
      <AnimatePresence mode="wait">
        {finalSelection.length > 0 ? (
          // 最终选择结果 - 替换标题区域
          <motion.div
            key="final-result"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8"
          >
            <div className="bg-gradient-to-r from-cyan-900/50 to-pink-900/50 border-2 border-cyan-400 rounded-2xl p-6 backdrop-blur-lg">
              <h4 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                🏆 最终选手确定！
              </h4>
              <div className="flex justify-center gap-12">
                {finalSelection.map((selectedIndex, i) => (
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0, x: i === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="text-center"
                  >
                    <div className="text-xl font-bold text-cyan-400 mb-2">选手 {i === 0 ? "A" : "B"}</div>
                    <div className="text-pink-400 font-bold text-lg">{candidatesToShow[selectedIndex].displayName}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          // 标题区域
          <motion.div
            key="title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-8"
          >
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent vaporwave-title">
              候选池
            </h3>
            <div className="bg-gradient-to-r from-cyan-400 to-pink-400 h-1 w-24 mx-auto rounded-full"></div>
            <p className="text-cyan-400 mt-3 text-lg">
              <span className="vaporwave-text-pink font-bold">{candidatesToShow.length}</span> 位勇士待命
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 控制按钮 */}
      <div className="text-center mb-8">
        <div className="flex justify-center gap-4">
          <motion.button
            onClick={startSelection}
            disabled={isSelecting || candidatesToShow.length < 2}
            className="vaporwave-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSelecting ? "⚡ 选择中..." : "🎯 开始选择"}
          </motion.button>

          {finalSelection.length > 0 && (
            <motion.button
              onClick={resetSelection}
              className="vaporwave-button px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              🔄 重新选择
            </motion.button>
          )}
        </div>
      </div>

      {/* 选择状态显示 */}
      <AnimatePresence>
        {isSelecting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-6"
          >
            <div className="bg-gradient-to-r from-cyan-900/50 to-pink-900/50 border border-cyan-400/50 rounded-lg p-4 backdrop-blur-lg">
              <p className="text-cyan-400 text-lg font-bold animate-pulse">🎯 AI正在随机选择参赛选手...</p>
              {selectedCandidates.length > 0 && (
                <div className="mt-2 text-pink-400">已选中: {selectedCandidates.length}/2 位选手</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 候选人网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 relative">
        {candidatesToShow.map((candidate, index) => {
          const isSpotlighted = spotlightTarget === index;
          const isSelected = selectedCandidates.includes(index);
          const isFinalSelected = finalSelection.includes(index);

          return (
            <motion.div
              key={candidate.id}
              className="group relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* 聚光灯效果 - 更强烈的背景色 */}
              <AnimatePresence>
                {isSpotlighted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -inset-4 pointer-events-none z-10"
                  >
                    <div className="w-full h-full bg-gradient-radial from-cyan-400/50 via-cyan-400/20 to-transparent rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-gradient-radial from-pink-400/40 via-pink-400/10 to-transparent rounded-full"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 选中光环效果 - 缩小尺寸 */}
              <AnimatePresence>
                {isFinalSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, rotate: 0 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    className="absolute -inset-3 pointer-events-none z-20"
                  >
                    <div className="w-full h-full border-3 border-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 rounded-full animate-spin-slow"></div>
                    <div className="absolute inset-1 border-2 border-cyan-400/50 rounded-full animate-ping"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className={`relative rounded-2xl p-4 text-center backdrop-blur-lg transition-all duration-300 border-2 ${
                  isFinalSelected
                    ? "bg-gradient-to-br from-cyan-500/30 to-pink-500/30 border-cyan-400 shadow-lg shadow-cyan-400/50 scale-110"
                    : isSelected
                      ? "bg-gradient-to-br from-pink-500/25 to-purple-500/25 border-pink-400 shadow-lg shadow-pink-400/25"
                      : isSpotlighted
                        ? "bg-gradient-to-br from-cyan-500/25 to-pink-500/25 border-cyan-400/80 shadow-lg shadow-cyan-400/30"
                        : "bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-cyan-400/50 hover:border-pink-400"
                } hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/25`}
                title={candidate.displayName}
                animate={{
                  scale: isFinalSelected ? 1.1 : isSpotlighted ? 1.05 : 1,
                  borderColor: isFinalSelected ? "#00FFFF" : isSpotlighted ? "#FF00FF" : "#00FFFF80",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* 更强烈的发光效果 */}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    background: isFinalSelected
                      ? "linear-gradient(135deg, rgba(0,255,255,0.4), rgba(255,0,255,0.4))"
                      : isSpotlighted
                        ? "linear-gradient(135deg, rgba(0,255,255,0.3), rgba(255,0,255,0.3))"
                        : "transparent",
                  }}
                  transition={{ duration: 0.3 }}
                />

                {/* 头像区域 */}
                <div className="relative mb-3">
                  {candidate.avatarUrl &&
                  (candidate.avatarUrl.startsWith("http") || candidate.avatarUrl.startsWith("/")) ? (
                    <Image
                      src={candidate.avatarUrl}
                      alt={candidate.displayName}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12 sm:w-14 sm:h-14 mx-auto border-2 border-cyan-400/50 group-hover:border-pink-400 transition-colors duration-300"
                    />
                  ) : (
                    <motion.div
                      className="text-3xl sm:text-4xl h-12 w-12 sm:h-14 sm:w-14 mx-auto flex items-center justify-center border-2 border-cyan-400/50 rounded-full bg-gradient-to-br from-cyan-400/20 to-pink-400/20 group-hover:border-pink-400 transition-all duration-300"
                      animate={{
                        borderColor: isFinalSelected ? "#00FFFF" : "#00FFFF80",
                        scale: isSpotlighted ? 1.1 : 1,
                      }}
                    >
                      {candidate.avatarUrl || "🎮"}
                    </motion.div>
                  )}

                  {/* 在线状态指示器 */}
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full border-2 border-purple-900"
                    animate={{
                      scale: isFinalSelected ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isFinalSelected ? Infinity : 0,
                    }}
                  />
                </div>

                {/* 名称和信息 */}
                <div className="relative z-10">
                  <motion.p
                    className="text-sm sm:text-base font-bold truncate w-full transition-colors duration-300"
                    animate={{
                      color: isFinalSelected ? "#FF00FF" : isSpotlighted ? "#00FFFF" : "#00FFFF",
                    }}
                  >
                    {candidate.displayName}
                  </motion.p>
                  <div className="text-xs text-purple-400 mt-1 opacity-70">
                    WARRIOR #{(index + 1).toString().padStart(3, "0")}
                  </div>
                </div>

                {/* 战力指示条 */}
                <div className="mt-3 relative">
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.random() * 40 + 60}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>
                  <div className="text-xs text-cyan-400/70 mt-1">POWER</div>
                </div>

                {/* 选中标识 */}
                <AnimatePresence>
                  {isFinalSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-2 right-2 text-2xl"
                    >
                      ⚡
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 底部装饰 */}
      <div className="text-center mt-8">
        <div className="inline-flex items-center space-x-2 text-cyan-400/70">
          <span className="w-8 h-px bg-gradient-to-r from-transparent to-cyan-400"></span>
          <span className="text-sm">准备就绪，等待召唤</span>
          <span className="w-8 h-px bg-gradient-to-l from-transparent to-cyan-400"></span>
        </div>
      </div>
    </div>
  );
}

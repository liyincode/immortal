"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
// 移除模拟服务，现在使用真实智能合约数据
import { useMatchStore } from "~~/services/store/matchStore";
import { MockUser, Seat } from "~~/services/types";

// 加油状态接口
interface CheerState {
  isActive: boolean;
  team: "A" | "B" | null;
  intensity: number; // 0-5，决定火焰大小
}

// 模拟当前用户 - 现在也使用表情符号头像
const MOCK_CURRENT_USER: MockUser = {
  id: "0xMyWalletAddressHere",
  displayName: "我",
  avatarUrl: "👤", // 使用一个简单的用户表情符号
};

export function AudienceSeating() {
  const { address: connectedAddress } = useAccount();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const { setUserRole } = useMatchStore(); // 需要setUserRole来完成入座

  // 每个座位的加油状态
  const [cheerStates, setCheerStates] = useState<Record<string, CheerState>>({});

  // 从智能合约读取座位总数 - 现在固定为3行布局，不再需要
  // const { data: totalSeats } = useScaffoldReadContract({
  //   contractName: "AudienceManager",
  //   functionName: "TOTAL_SEATS",
  // });

  // 读取当前比赛ID
  const { data: currentMatchId } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "currentMatchId",
  });

  // 智能合约写入钩子
  const { writeContractAsync: writeAudienceManager } = useScaffoldWriteContract({
    contractName: "AudienceManager",
  });

  // 从智能合约读取已占用的座位信息
  const { data: occupiedSeatInfo } = useScaffoldReadContract({
    contractName: "AudienceManager",
    functionName: "getOccupiedSeatInfo",
    args: currentMatchId ? [currentMatchId] : [BigInt(0)],
  });

  // 检查当前用户是否是候选人
  const { data: isUserCandidate } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "isCandidate",
    args: [currentMatchId || 0n, connectedAddress || "0x"],
  });

  // 计算行列数，固定为3行
  const rows = 3; // 固定3行 (A, B, C)
  const cols = 8; // 每行8个座位
  const numSeats = rows * cols; // 总共24个座位

  // 使用真实连接的地址或回退到模拟用户
  const currentUserId = connectedAddress || MOCK_CURRENT_USER.id;
  const currentUserHasSeat = seats.some(seat => seat.isOccupied && seat.occupant?.id === currentUserId);

  // 获取当前用户的座位
  const currentUserSeat = seats.find(seat => seat.isOccupied && seat.occupant?.id === currentUserId);

  // 加油功能函数
  const startCheer = (team: "A" | "B") => {
    if (!currentUserSeat) {
      toast.error("请先选择座位才能加油！");
      return;
    }

    setCheerStates(prev => ({
      ...prev,
      [currentUserSeat.id]: {
        isActive: true,
        team,
        intensity: 1,
      },
    }));

    // 模拟加油强度递增
    let intensity = 1;
    const interval = setInterval(() => {
      intensity = Math.min(intensity + 1, 5);
      setCheerStates(prev => ({
        ...prev,
        [currentUserSeat.id]: {
          ...prev[currentUserSeat.id],
          intensity,
        },
      }));

      if (intensity >= 5) {
        clearInterval(interval);
        // 3秒后停止加油
        setTimeout(() => {
          setCheerStates(prev => ({
            ...prev,
            [currentUserSeat.id]: {
              ...prev[currentUserSeat.id],
              isActive: false,
              intensity: 0,
            },
          }));
        }, 3000);
      }
    }, 500);

    toast.success(`🔥 为选手${team}加油！火力全开！`);
  };

  // 火焰效果组件 - 真正在头上的火焰
  const FlameEffect = ({ intensity, team }: { intensity: number; team: "A" | "B" }) => {
    const flames = Array.from({ length: Math.min(intensity, 3) }, (_, i) => i); // 最多3团火焰
    const isBlue = team === "A";

    return (
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 pointer-events-none z-10">
        <AnimatePresence>
          {flames.map(i => (
            <motion.div
              key={i}
              className={`absolute ${isBlue ? "text-blue-400" : "text-red-400"}`}
              style={{
                left: `${(i - flames.length / 2) * 6}px`,
                fontSize: `${8 + intensity * 2}px`, // 基于强度调整大小
                filter: `drop-shadow(0 0 ${intensity * 2}px ${isBlue ? "#3b82f6" : "#ef4444"})`,
              }}
              initial={{ opacity: 0, y: 5, scale: 0.3 }}
              animate={{
                opacity: [0.3, 1, 0.7, 1],
                y: [-5, -15, -10, -20],
                scale: [0.3, 0.8, 0.6, 1],
                rotate: [0, Math.random() * 15 - 7.5, Math.random() * 10 - 5],
              }}
              exit={{ opacity: 0, scale: 0, y: -25 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
            >
              🔥
            </motion.div>
          ))}

          {/* 热力效果 - 更多的小火花 */}
          {intensity > 3 &&
            Array.from({ length: intensity - 3 }, (_, i) => (
              <motion.div
                key={`spark-${i}`}
                className={`absolute text-xs ${isBlue ? "text-blue-300" : "text-red-300"}`}
                style={{
                  left: `${(Math.random() - 0.5) * 20}px`,
                  fontSize: `${6 + Math.random() * 4}px`,
                }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [-8, -25],
                  scale: [0, 0.6, 0],
                  x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 15],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              >
                ✨
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    );
  };

  // 生成基于智能合约数据的座位布局
  useEffect(() => {
    const generateSeatLayout = () => {
      setIsLoading(true);
      try {
        // 生成所有座位的基础数据
        const allSeats: Seat[] = [];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const seatIndex = row * cols + col;
            if (seatIndex < numSeats) {
              const seatId = `${String.fromCharCode(65 + row)}-${col + 1}`;
              allSeats.push({
                id: seatId,
                row: row,
                col: col,
                isOccupied: false,
                occupant: undefined,
              });
            }
          }
        }

        // 如果有智能合约的占用数据，则更新座位状态
        if (occupiedSeatInfo && occupiedSeatInfo[0] && occupiedSeatInfo[1]) {
          const [seatIds, occupants] = occupiedSeatInfo;

          for (let i = 0; i < seatIds.length; i++) {
            const chainSeatId = Number(seatIds[i]); // 智能合约中的座位ID (1-indexed)
            const occupantAddress = occupants[i];

            // 根据智能合约的座位ID找到对应的前端座位
            const seatIndex = chainSeatId - 1; // 转换为0-indexed
            if (seatIndex >= 0 && seatIndex < allSeats.length) {
              allSeats[seatIndex] = {
                ...allSeats[seatIndex],
                isOccupied: true,
                occupant: {
                  id: occupantAddress,
                  displayName: `${occupantAddress.slice(0, 6)}...${occupantAddress.slice(-4)}`,
                  avatarUrl: "👤",
                },
              };
            }
          }
        }

        // 添加模拟观众数据 - 为了演示效果
        const mockAvatars = [
          "👨",
          "👩",
          "🧑",
          "👦",
          "👧",
          "👴",
          "👵",
          "🧔",
          "👱",
          "👩‍🦱",
          "👨‍🦲",
          "👩‍🦳",
          "🤓",
          "😎",
          "🥳",
          "🤖",
          "👾",
          "🦄",
          "🐱",
          "🐶",
          "🦊",
          "🐼",
          "🐸",
          "🐯",
          "🦁",
          "🐻",
        ];
        const mockNames = [
          "小明",
          "小红",
          "大华",
          "小李",
          "阿强",
          "美美",
          "志明",
          "春娇",
          "大雄",
          "静香",
          "胖虎",
          "小夫",
          "阿杰",
          "晓芳",
          "大伟",
          "小燕",
          "建华",
          "丽娜",
          "浩然",
          "雅琴",
          "志强",
          "婷婷",
          "文杰",
          "思雨",
        ];

        // 随机占用16-20个座位
        const occupiedCount = Math.floor(Math.random() * 5) + 16;
        const availableIndexes = allSeats.map((_, index) => index).filter(index => !allSeats[index].isOccupied);

        for (let i = 0; i < Math.min(occupiedCount, availableIndexes.length); i++) {
          const randomIndex = Math.floor(Math.random() * availableIndexes.length);
          const seatIndex = availableIndexes.splice(randomIndex, 1)[0];

          allSeats[seatIndex] = {
            ...allSeats[seatIndex],
            isOccupied: true,
            occupant: {
              id: `mock_user_${i}`,
              displayName: mockNames[i % mockNames.length] + i,
              avatarUrl: mockAvatars[i % mockAvatars.length],
            },
          };
        }

        setSeats(allSeats);

        // 模拟观众自动加油
        setTimeout(() => {
          const mockCheerStates: Record<string, CheerState> = {};

          allSeats.forEach(seat => {
            if (seat.isOccupied && seat.occupant?.id.startsWith("mock_user_")) {
              // 70%的观众会加油
              if (Math.random() < 0.7) {
                const team = Math.random() < 0.5 ? "A" : "B"; // 随机支持A或B
                const intensity = Math.floor(Math.random() * 4) + 2; // 2-5级强度

                mockCheerStates[seat.id] = {
                  isActive: true,
                  team,
                  intensity,
                };
              }
            }
          });

          setCheerStates(mockCheerStates);

          // 每隔3-8秒随机更新一些观众的加油状态
          const cheerInterval = setInterval(
            () => {
              setCheerStates(prev => {
                const newStates = { ...prev };

                allSeats.forEach(seat => {
                  if (seat.isOccupied && seat.occupant?.id.startsWith("mock_user_")) {
                    // 30%概率改变加油状态
                    if (Math.random() < 0.3) {
                      if (newStates[seat.id]?.isActive) {
                        // 停止加油
                        newStates[seat.id] = { isActive: false, team: null, intensity: 0 };
                      } else if (Math.random() < 0.6) {
                        // 开始加油
                        const team = Math.random() < 0.5 ? "A" : "B";
                        const intensity = Math.floor(Math.random() * 4) + 2;
                        newStates[seat.id] = { isActive: true, team, intensity };
                      }
                    }
                  }
                });

                return newStates;
              });
            },
            Math.random() * 5000 + 3000,
          ); // 3-8秒随机间隔

          // 清理定时器
          return () => clearInterval(cheerInterval);
        }, 1000); // 1秒后开始模拟加油
      } catch (error) {
        console.error("Failed to generate seat layout:", error);
        toast.error("加载座位信息失败");
      } finally {
        setIsLoading(false);
      }
    };

    generateSeatLayout();
  }, [rows, cols, numSeats, occupiedSeatInfo]);

  const handleSeatClick = async (seat: Seat) => {
    // 检查用户是否是候选人，候选人不能选座
    if (isUserCandidate && !seat.isOccupied) {
      toast.error("你已经报名参赛，不能选择观众席位！\n请先退出候选池再选座。");
      return;
    }

    // 允许用户直接选座，无需先点击"我要加油"
    if (seat.isOccupied && seat.occupant?.id !== currentUserId) {
      toast.error("这个座位已经被占啦！");
      return;
    }
    if (currentUserHasSeat && seat.occupant?.id !== currentUserId && !seat.isOccupied) {
      toast.error("你已经有座位了，不能再选其他空座位。");
      return;
    }
    // 如果是当前用户点击自己已占的座位，允许取消选座
    if (seat.isOccupied && seat.occupant?.id === currentUserId) {
      if (!connectedAddress) {
        toast.error("请先连接钱包");
        return;
      }

      if (!currentMatchId) {
        toast.error("当前没有活跃的比赛");
        return;
      }

      const toastId = toast.loading(`正在取消座位 ${seat.id}...`);
      try {
        // 调用智能合约的leaveSeat函数
        await writeAudienceManager({
          functionName: "leaveSeat",
          args: [currentMatchId],
        });

        // 更新本地状态
        setSeats(prevSeats =>
          prevSeats.map(s => (s.id === seat.id ? { ...s, isOccupied: false, occupant: undefined } : s)),
        );
        toast.success(`座位 ${seat.id} 已取消`, { id: toastId });
        setSelectedSeatId(null);
      } catch (error) {
        console.error("取消座位时发生错误", error);
        toast.error("取消座位失败，请重试", { id: toastId });
      }
      return;
    }

    setSelectedSeatId(seat.id);

    if (!connectedAddress) {
      toast.error("请先连接钱包");
      return;
    }

    if (!currentMatchId) {
      toast.error("当前没有活跃的比赛");
      return;
    }

    const toastId = toast.loading(`正在为你预留座位 ${seat.id}...`);
    try {
      // 根据座位在数组中的位置计算座位号 (1-indexed)
      const seatIndex = seats.findIndex(s => s.id === seat.id);
      const seatNumber = seatIndex + 1;

      // 调用智能合约的takeSeat函数
      await writeAudienceManager({
        functionName: "takeSeat",
        args: [currentMatchId, BigInt(seatNumber)],
      });

      // 创建当前用户对象用于本地状态更新
      const currentUser = {
        id: currentUserId,
        displayName: connectedAddress ? `${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : "我",
        avatarUrl: "👤",
      };

      // 更新本地座位状态
      setSeats(prevSeats =>
        prevSeats.map(s => (s.id === seat.id ? { ...s, isOccupied: true, occupant: currentUser } : s)),
      );

      // 成功入座，设置为观众状态
      setUserRole("audience", currentUser);
      toast.success(`🎪 成功入座！座位 ${seat.id}`, { id: toastId });

      setSelectedSeatId(null);
    } catch (error) {
      console.error("选座时发生错误", error);
      toast.error("选座失败，请重试", { id: toastId });
      setSelectedSeatId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {[...Array(numSeats)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded bg-neutral/20"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className={`grid gap-2 sm:gap-3`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {seats.map(seat => {
          const isCurrentUserSeat = seat.isOccupied && seat.occupant?.id === currentUserId;
          const cheerState = cheerStates[seat.id];
          const isCheeringActive = cheerState?.isActive && cheerState.intensity > 0;
          let seatContent;

          if (seat.isOccupied && seat.occupant) {
            const occupant = seat.occupant;
            const avatarDisplay = occupant.avatarUrl; // 现在可能包含表情符号或 URL

            // 判断 avatarDisplay 是 URL 还是表情符号
            if (avatarDisplay) {
              // 简单的 URL 检查 (可以根据需要改进)
              const isUrl =
                avatarDisplay.startsWith("http://") ||
                avatarDisplay.startsWith("https://") ||
                avatarDisplay.startsWith("/");
              if (isUrl) {
                seatContent = (
                  <div
                    title={occupant.displayName}
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                  >
                    <Image
                      src={avatarDisplay}
                      alt={occupant.displayName}
                      width={32}
                      height={32}
                      className="rounded-full object-cover w-6 h-6 sm:w-8 sm:h-8"
                    />
                  </div>
                );
              } else {
                // 如果不是 URL，则假定为表情符号
                seatContent = (
                  <motion.div
                    title={occupant.displayName}
                    className="w-full h-full flex items-center justify-center text-lg sm:text-xl"
                    animate={
                      isCheeringActive
                        ? {
                            scale: [1, 1.2, 1],
                            textShadow:
                              cheerState?.team === "A"
                                ? ["0 0 0px #3b82f6", "0 0 20px #3b82f6", "0 0 0px #3b82f6"]
                                : ["0 0 0px #ef4444", "0 0 20px #ef4444", "0 0 0px #ef4444"],
                          }
                        : {}
                    }
                    transition={{ duration: 0.5, repeat: isCheeringActive ? Infinity : 0 }}
                  >
                    {avatarDisplay}
                  </motion.div>
                );
              }
            } else {
              // 如果没有 avatarUrl，显示名字缩写
              seatContent = (
                <motion.span
                  className="text-xs sm:text-sm font-bold"
                  animate={
                    isCheeringActive
                      ? {
                          scale: [1, 1.1, 1],
                          color: cheerState?.team === "A" ? "#3b82f6" : "#ef4444",
                        }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: isCheeringActive ? Infinity : 0 }}
                >
                  {occupant.displayName.substring(0, 2).toUpperCase()}
                </motion.span>
              );
            }
          } else {
            seatContent = <span className="text-xs">{seat.id}</span>;
          }

          return (
            <div key={seat.id} className="relative overflow-visible">
              <motion.button
                onClick={() => handleSeatClick(seat)}
                title={seat.isOccupied ? `座位 ${seat.id} - ${seat.occupant?.displayName}` : `选择座位 ${seat.id}`}
                className={`vaporwave-seat ${
                  seat.isOccupied
                    ? isCurrentUserSeat
                      ? "vaporwave-seat-mine"
                      : "vaporwave-seat-occupied"
                    : "vaporwave-seat-empty"
                } ${selectedSeatId === seat.id && !seat.isOccupied ? "vaporwave-seat-selected" : ""}`}
                animate={
                  isCheeringActive
                    ? {
                        boxShadow:
                          cheerState?.team === "A"
                            ? ["0 0 10px #3b82f6", "0 0 25px #3b82f6", "0 0 10px #3b82f6"]
                            : ["0 0 10px #ef4444", "0 0 25px #ef4444", "0 0 10px #ef4444"],
                      }
                    : {}
                }
                transition={{ duration: 0.8, repeat: isCheeringActive ? Infinity : 0 }}
              >
                {seatContent}

                {/* 火焰效果 - 直接在按钮内部 */}
                {isCheeringActive && cheerState && (
                  <FlameEffect intensity={cheerState.intensity} team={cheerState.team!} />
                )}
              </motion.button>
            </div>
          );
        })}
      </div>
      {!currentUserHasSeat && !isUserCandidate && (
        <div className="text-center mt-4">
          <p className="text-sm vaporwave-info-text mb-4">请选择一个空位加入观战！</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-bold rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎲 重新生成观众
          </motion.button>
        </div>
      )}
      {currentUserHasSeat && (
        <div className="text-center mt-6">
          <p className="text-sm vaporwave-success-text mb-4">你已成功入座！为你支持的选手加油吧！</p>
          <div className="flex justify-center gap-4">
            <motion.button
              onClick={() => startCheer("A")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={cheerStates[currentUserSeat?.id || ""]?.isActive}
            >
              🔥 为选手A加油
            </motion.button>
            <motion.button
              onClick={() => startCheer("B")}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={cheerStates[currentUserSeat?.id || ""]?.isActive}
            >
              🔥 为选手B加油
            </motion.button>
          </div>
          {cheerStates[currentUserSeat?.id || ""]?.isActive && (
            <motion.p
              className="text-sm text-yellow-400 mt-2"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎉 加油中...火力全开！
            </motion.p>
          )}
        </div>
      )}
      {isUserCandidate && (
        <p className="text-center mt-4 text-sm vaporwave-warning-text">你已报名参赛，无法选择观众席位。</p>
      )}
    </div>
  );
}

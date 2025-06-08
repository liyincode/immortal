"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import type { ImmortalBlockRecord } from "~~/services/types";

export function ImmortalChainDisplay() {
  const [records, setRecords] = useState<ImmortalBlockRecord[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement>(null);

  // 读取合约中的最近记录
  const { data: contractRecords, isLoading } = useScaffoldReadContract({
    contractName: "ImmortalBlock",
    functionName: "getRecentRecords",
    args: [7n], // 获取最近7条记录，使用 BigInt
  });

  const currentSelectedRecord = records.find(r => r.id === selectedBlockId);

  // 将合约数据转换为前端使用的格式
  useEffect(() => {
    if (contractRecords && contractRecords.length > 0) {
      const formattedRecords: ImmortalBlockRecord[] = contractRecords.map(record => ({
        id: `${record.matchId.toString()}-${record.timestamp.toString()}`, // 使用 matchId 和 timestamp 组合作为唯一ID
        winnerName: record.winnerName,
        matchDate: new Date(Number(record.timestamp) * 1000).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
        // 保存原始合约数据以备后用
        originalRecord: record,
      }));
      setRecords(formattedRecords);
    } else {
      setRecords([]);
    }
  }, [contractRecords]);

  // Effect to control modal visibility based on selectedBlockId
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (selectedBlockId && currentSelectedRecord) {
        modalElement.showModal();
      } else {
        // Check if modal is open before trying to close, to avoid errors
        if (modalElement.hasAttribute("open")) {
          modalElement.close();
        }
      }
    }
  }, [selectedBlockId, currentSelectedRecord]);

  // Effect to listen for modal close event (e.g., ESC key)
  useEffect(() => {
    const modalElement = modalRef.current;
    const handleModalClose = () => {
      setSelectedBlockId(null); // Reset selectedBlockId when modal is closed
    };

    if (modalElement) {
      modalElement.addEventListener("close", handleModalClose);
      return () => {
        modalElement.removeEventListener("close", handleModalClose);
      };
    }
  }, []);

  const handleBlockClick = (recordId: string) => {
    setSelectedBlockId(recordId); // This will trigger the useEffect to show the modal
  };

  // 生成随机浮动动画参数的函数
  const generateFloatingAnimation = () => ({
    y: [0, -8, 0, -5, 0],
    x: [0, 2, 0, -1, 0],
    rotate: [0, 1, 0, -0.5, 0],
    scale: [1, 1.02, 1, 1.01, 1],
  });

  // 生成随机抖动动画
  const generateShakeAnimation = () => ({
    x: [0, 1, -1, 0.5, 0],
    y: [0, -0.5, 1, -0.3, 0],
    rotate: [0, 0.3, -0.2, 0.1, 0],
  });

  if (isLoading) {
    return (
      <div className="w-full py-2 flex items-center justify-start space-x-3 overflow-hidden">
        <motion.span
          className="text-xs text-cyan-300 font-medium mr-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          不朽链
        </motion.span>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="h-16 w-24 md:w-28 rounded-lg bg-gradient-to-br from-neutral/30 to-neutral/10 border border-neutral/20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
              ...generateFloatingAnimation(),
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="w-full py-2 flex items-center justify-start">
        <motion.span
          className="text-xs text-cyan-300 font-medium mr-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          不朽链
        </motion.span>
        <motion.div
          className="text-center text-neutral-content/70 text-sm"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          暂无记录
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full py-2 relative overflow-hidden">
      {/* 太空背景效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-50"></div>

      {/* 区块容器 */}
      <div className="flex items-center justify-start space-x-3 relative z-10">
        {/* 不朽链标签 */}
        <motion.span
          className="text-xs text-cyan-300 font-medium mr-2 flex-shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          不朽链
        </motion.span>

        {/* 显示最近的记录 */}
        <AnimatePresence>
          {records.slice(0, 3).map((record, index) => (
            <motion.div
              key={record.id}
              className="shrink-0 flex items-center"
              initial={{ opacity: 0, scale: 0.5, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.5, x: 50 }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                type: "spring",
                stiffness: 100,
              }}
            >
              {/* 区块本身 */}
              <motion.div
                onClick={() => handleBlockClick(record.id)}
                className="h-16 w-24 md:w-28 bg-gradient-to-br from-cyan-500/30 to-pink-500/30 border border-cyan-400/50 rounded-lg flex flex-col items-center justify-center p-2 text-center cursor-pointer backdrop-blur-sm relative overflow-hidden group"
                animate={{
                  ...generateFloatingAnimation(),
                  boxShadow: [
                    "0 0 10px rgba(0, 255, 255, 0.2)",
                    "0 0 20px rgba(0, 255, 255, 0.3)",
                    "0 0 10px rgba(0, 255, 255, 0.2)",
                    "0 0 15px rgba(255, 0, 255, 0.2)",
                    "0 0 10px rgba(0, 255, 255, 0.2)",
                  ],
                }}
                transition={{
                  duration: 4 + index * 0.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1],
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 2,
                  boxShadow: "0 0 25px rgba(0, 255, 255, 0.5)",
                  border: "1px solid rgba(0, 255, 255, 0.8)",
                }}
                whileTap={{
                  scale: 0.95,
                  rotate: -1,
                }}
              >
                {/* 内部发光效果 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-pink-400/20 rounded-lg"
                  animate={{
                    opacity: [0.2, 0.4, 0.2, 0.3, 0.2],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* 星尘粒子效果 */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-cyan-300 rounded-full"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${10 + i * 20}%`,
                      }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        x: [0, 5, 0],
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.7,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>

                {/* 陨石表面纹理 */}
                <motion.div
                  className="absolute inset-0 border border-cyan-400/30 rounded-lg"
                  animate={generateShakeAnimation()}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                <div className="relative z-10">
                  <motion.div
                    className="text-xs font-semibold truncate w-full px-1 text-white"
                    animate={{
                      textShadow: [
                        "0 0 5px rgba(0, 255, 255, 0.5)",
                        "0 0 10px rgba(0, 255, 255, 0.8)",
                        "0 0 5px rgba(0, 255, 255, 0.5)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                    }}
                  >
                    🏆 {record.winnerName}
                  </motion.div>
                  <div className="text-[10px] mt-1 text-cyan-200">{record.matchDate}</div>
                </div>
              </motion.div>

              {/* 连接线 - 能量流效果 */}
              <motion.div
                className="w-4 h-1 bg-gradient-to-r from-cyan-400/50 to-pink-400/50 rounded-full relative overflow-hidden"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scaleX: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* 能量流动效果 */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 待获取区块 - 神秘漂浮效果 */}
        <motion.div
          className="shrink-0 flex items-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.div
            className="h-16 w-24 md:w-28 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-400/60 rounded-lg flex flex-col items-center justify-center p-2 text-center cursor-pointer backdrop-blur-sm relative overflow-hidden group"
            animate={{
              y: [0, -10, 0, -6, 0],
              rotate: [0, 2, 0, -1, 0],
              borderColor: [
                "rgba(251, 191, 36, 0.6)",
                "rgba(251, 191, 36, 0.9)",
                "rgba(251, 191, 36, 0.6)",
                "rgba(249, 115, 22, 0.8)",
                "rgba(251, 191, 36, 0.6)",
              ],
              boxShadow: [
                "0 0 15px rgba(251, 191, 36, 0.3)",
                "0 0 25px rgba(251, 191, 36, 0.5)",
                "0 0 15px rgba(251, 191, 36, 0.3)",
                "0 0 20px rgba(249, 115, 22, 0.4)",
                "0 0 15px rgba(251, 191, 36, 0.3)",
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              borderColor: "rgba(251, 191, 36, 1)",
              boxShadow: "0 0 30px rgba(251, 191, 36, 0.7)",
            }}
          >
            {/* 神秘光环 */}
            <motion.div
              className="absolute inset-0 rounded-lg border border-amber-300/30"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            />

            {/* 待争夺粒子效果 */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-300 rounded-full"
                  style={{
                    left: `${15 + i * 25}%`,
                    top: `${15 + i * 20}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.3, 1.2, 0.3],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 3 + i * 0.3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <motion.div
                className="text-xs font-semibold text-amber-200"
                animate={{
                  textShadow: [
                    "0 0 5px rgba(251, 191, 36, 0.5)",
                    "0 0 10px rgba(251, 191, 36, 0.8)",
                    "0 0 5px rgba(251, 191, 36, 0.5)",
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                }}
              >
                ⭐ 待争夺
              </motion.div>
              <div className="text-[10px] mt-1 text-amber-300">下个是你？</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* DaisyUI Modal - 保持原样，但添加动画 */}
      <dialog ref={modalRef} id="immortal_block_modal" className="modal modal-bottom sm:modal-middle">
        <motion.div
          className="modal-box bg-neutral text-neutral-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {currentSelectedRecord ? (
            <>
              <h3 className="font-bold text-xl text-accent mb-4 border-b border-neutral-focus pb-2">区块详情</h3>
              <div className="space-y-3">
                <p>
                  <strong>区块 ID:</strong> <span className="text-sm break-all">{currentSelectedRecord.id}</span>
                </p>
                <p>
                  <strong>胜利者:</strong> {currentSelectedRecord.winnerName}
                </p>
                <p>
                  <strong>比赛日期:</strong> {currentSelectedRecord.matchDate}
                </p>
                {currentSelectedRecord.originalRecord && (
                  <>
                    <p>
                      <strong>比赛 ID:</strong> {currentSelectedRecord.originalRecord.matchId.toString()}
                    </p>
                    <p>
                      <strong>胜利者地址:</strong>
                      <span className="text-xs break-all block mt-1 font-mono">
                        {currentSelectedRecord.originalRecord.winner}
                      </span>
                    </p>
                    {currentSelectedRecord.originalRecord.extraData && (
                      <p>
                        <strong>额外信息:</strong> {currentSelectedRecord.originalRecord.extraData}
                      </p>
                    )}
                    <p>
                      <strong>记录时间:</strong>
                      <span className="text-sm">
                        {new Date(Number(currentSelectedRecord.originalRecord.timestamp) * 1000).toLocaleString(
                          "zh-CN",
                        )}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <p>加载区块信息中...</p>
          )}
          <div className="modal-action mt-6">
            <form method="dialog">
              <button className="btn btn-primary">关闭</button>
            </form>
          </div>
        </motion.div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

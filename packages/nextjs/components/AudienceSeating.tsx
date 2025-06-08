"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
// 移除模拟服务，现在使用真实智能合约数据
import { useMatchStore } from "~~/services/store/matchStore";
import { MockUser, Seat } from "~~/services/types";

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

        setSeats(allSeats);
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
                  <div
                    title={occupant.displayName}
                    className="w-full h-full flex items-center justify-center text-lg sm:text-xl"
                  >
                    {avatarDisplay}
                  </div>
                );
              }
            } else {
              // 如果没有 avatarUrl，显示名字缩写
              seatContent = (
                <span className="text-xs sm:text-sm font-bold">
                  {occupant.displayName.substring(0, 2).toUpperCase()}
                </span>
              );
            }
          } else {
            seatContent = <span className="text-xs">{seat.id}</span>;
          }

          return (
            <button
              key={seat.id}
              onClick={() => handleSeatClick(seat)}
              title={seat.isOccupied ? `座位 ${seat.id} - ${seat.occupant?.displayName}` : `选择座位 ${seat.id}`}
              className={`vaporwave-seat ${
                seat.isOccupied
                  ? isCurrentUserSeat
                    ? "vaporwave-seat-mine"
                    : "vaporwave-seat-occupied"
                  : "vaporwave-seat-empty"
              } ${selectedSeatId === seat.id && !seat.isOccupied ? "vaporwave-seat-selected" : ""}`}
            >
              {seatContent}
            </button>
          );
        })}
      </div>
      {!currentUserHasSeat && !isUserCandidate && (
        <p className="text-center mt-4 text-sm vaporwave-info-text">请选择一个空位加入观战！</p>
      )}
      {currentUserHasSeat && (
        <p className="text-center mt-4 text-sm vaporwave-success-text">你已成功入座！敬请期待比赛开始。</p>
      )}
      {isUserCandidate && (
        <p className="text-center mt-4 text-sm vaporwave-warning-text">你已报名参赛，无法选择观众席位。</p>
      )}
    </div>
  );
}

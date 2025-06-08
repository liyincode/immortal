"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
// 移除模拟服务导入，现在只做UI引导
import { useMatchStore } from "~~/services/store/matchStore";

// 保留加油的模拟服务

export function UserActionButtons() {
  const { address: connectedAddress } = useAccount();
  const [isRegistering, setIsRegistering] = useState(false);

  const { userRole, registrationStatus, setUserRole, setRegistrationStatus } = useMatchStore();

  // 读取当前用户是否已经报名
  const { data: currentMatchId } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "currentMatchId",
  });

  const { data: registrationOpen } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "registrationOpen",
  });

  const { data: isCandidate, refetch: refetchIsCandidate } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "isCandidate",
    args: [currentMatchId || 0n, connectedAddress || "0x"],
  });

  // 检查用户是否已经在当前比赛中选座
  const { data: userSeatId } = useScaffoldReadContract({
    contractName: "AudienceManager",
    functionName: "getUserSeatId",
    args: [currentMatchId || 0n, connectedAddress || "0x"],
  });

  // 智能合约写入钩子
  const { writeContractAsync: writeMatchRegistry } = useScaffoldWriteContract({
    contractName: "MatchRegistry",
  });

  const handleFight = async () => {
    if (!connectedAddress) {
      toast.error("请先连接钱包");
      return;
    }

    if (!registrationOpen) {
      toast.error("报名尚未开启");
      return;
    }

    if (isCandidate) {
      toast("你已经在候选池中了！");
      return;
    }

    if (hasSelectedSeat) {
      toast.error("你已经选择了观众席位，不能再报名参赛！\n请先取消座位再报名。");
      return;
    }

    try {
      setIsRegistering(true);
      setRegistrationStatus("pending");
      toast.loading("正在报名成为斗士...", { id: "fightReg" });

      await writeMatchRegistry({
        functionName: "registerAsFighter",
      });

      // 创建用户对象用于状态管理
      const currentUser = {
        id: connectedAddress,
        displayName: "我", // 可以后续从ENS获取
        avatarUrl: "👤",
      };

      setUserRole("fighterCandidate", currentUser);
      setRegistrationStatus("success", "报名成功！等待比赛开始");
      toast.dismiss("fightReg");
      toast.success("报名成功！等待比赛开始");

      // 刷新状态
      refetchIsCandidate();
    } catch (error) {
      console.error("报名失败:", error);
      setRegistrationStatus("error", "报名失败，请重试");
      toast.dismiss("fightReg");
      toast.error("报名失败，请重试");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCheer = async () => {
    if (!connectedAddress) {
      toast.error("请先连接钱包");
      return;
    }

    // 如果已经是观众或已经选座，提供引导信息
    if (userRole === "audience" || hasSelectedSeat) {
      toast("🎪 你已经是观众了！\n👇 你可以在观众席中选择座位或取消座位", {
        duration: 4000,
        icon: "🎪",
      });
      return;
    }

    // 只是UI引导，提示用户去选择座位
    toast.success("🎪 欢迎成为观众！\n👇 请在下方观众席选择你的专属座位完成入座！", {
      duration: 5000,
    });
  };

  const isLoading = registrationStatus === "pending" || isRegistering;
  const isAlreadyCandidate = isCandidate || userRole === "fighterCandidate";
  const hasSelectedSeat = userSeatId ? Number(userSeatId) > 0 : false; // 用户已经在观众席选座

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
      {/* 战斗按钮 */}
      <motion.button
        onClick={handleFight}
        disabled={isLoading || isAlreadyCandidate || !registrationOpen}
        className={`
          relative overflow-hidden px-8 py-4 w-72 text-lg font-bold rounded-2xl
          border-2 backdrop-blur-lg transition-all duration-300
          ${
            isAlreadyCandidate
              ? "bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-green-400 text-green-400"
              : !registrationOpen
                ? "bg-gradient-to-r from-gray-500/20 to-gray-700/20 border-gray-500 text-gray-400"
                : "bg-gradient-to-r from-pink-500/20 to-red-500/20 border-pink-400 text-pink-400 hover:from-pink-500/30 hover:to-red-500/30 hover:border-pink-300 hover:text-pink-300 hover:shadow-lg hover:shadow-pink-400/25"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          group
        `}
        whileHover={!isLoading && !isAlreadyCandidate && registrationOpen ? { scale: 1.05 } : {}}
        whileTap={!isLoading && !isAlreadyCandidate && registrationOpen ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 背景发光效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* 加载动画效果 */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}

        {/* 按钮图标和文字 */}
        <div className="relative z-10 flex items-center justify-center gap-3">
          <span className="text-2xl">{isAlreadyCandidate ? "⚔️" : !registrationOpen ? "🔒" : "⚡"}</span>
          <span>{isAlreadyCandidate ? "等待比赛开始" : !registrationOpen ? "报名未开启" : "我要战斗"}</span>
        </div>

        {/* 边框发光效果 */}
        {!isLoading && !isAlreadyCandidate && registrationOpen && (
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-pink-300/50"></div>
        )}
      </motion.button>

      {/* 加油按钮 */}
      <motion.button
        onClick={handleCheer}
        disabled={isLoading || userRole === "audience" || hasSelectedSeat}
        className={`
          relative overflow-hidden px-8 py-4 w-72 text-lg font-bold rounded-2xl
          border-2 backdrop-blur-lg transition-all duration-300
          ${
            hasSelectedSeat
              ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400 text-purple-400"
              : userRole === "audience"
                ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400 text-purple-400"
                : "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 hover:border-cyan-300 hover:text-cyan-300 hover:shadow-lg hover:shadow-cyan-400/25"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          group
        `}
        whileHover={!isLoading && userRole !== "audience" && !hasSelectedSeat ? { scale: 1.05 } : {}}
        whileTap={!isLoading && userRole !== "audience" && !hasSelectedSeat ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* 背景发光效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* 按钮图标和文字 */}
        <div className="relative z-10 flex items-center justify-center gap-3">
          <span className="text-2xl">{hasSelectedSeat ? "🪑" : userRole === "audience" ? "🎪" : "🎪"}</span>
          <span>{hasSelectedSeat ? "已选座位" : userRole === "audience" ? "你在观众席" : "我要加油"}</span>
        </div>

        {/* 边框发光效果 */}
        {!isLoading && userRole !== "audience" && !hasSelectedSeat && (
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-2 border-cyan-300/50"></div>
        )}
      </motion.button>
    </div>
  );
}

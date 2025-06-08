"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AudienceSeating } from "~~/components/AudienceSeating";
import { CandidatePoolDisplay } from "~~/components/CandidatePoolDisplay";
// <--- 导入新组件
import { UserActionButtons } from "~~/components/UserActionButtons";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";
import { getNextMatchTime } from "~~/services/mockContractService";
import { useMatchStore } from "~~/services/store/matchStore";

interface SelectedFighters {
  playerA: string;
  playerB: string;
}

export default function MainPage() {
  const { nextMatchTime, setNextMatchTime } = useMatchStore();
  const router = useRouter();

  // 比赛开始状态
  const [selectedFighters, setSelectedFighters] = useState<SelectedFighters | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 读取当前比赛状态
  const { data: currentMatchId } = useScaffoldReadContract({
    contractName: "MatchRegistry",
    functionName: "currentMatchId",
  });

  const { data: matchData } = useScaffoldReadContract({
    contractName: "MatchContract",
    functionName: "matches",
    args: [currentMatchId || 0n],
  });

  // 解析比赛状态
  // MatchStatus枚举: NotStarted=0, AwaitingFirstQuestion=1, InProgress=2, PlayerAReplaceable=3, PlayerBReplaceable=4, Concluded=5
  const matchStatus = matchData?.[6]; // status是第7个元素（index 6）
  const isMatchInProgress = matchStatus !== undefined && matchStatus > 0 && matchStatus < 5; // 1-4 表示比赛进行中

  // 监听比赛开始事件
  useScaffoldWatchContractEvent({
    contractName: "MatchContract",
    eventName: "MatchStarted",
    onLogs: logs => {
      logs.forEach(log => {
        const { playerA, playerB } = log.args;
        console.log("比赛开始事件：", { playerA, playerB });

        setSelectedFighters({
          playerA: playerA as string,
          playerB: playerB as string,
        });
        setShowCongratulations(true);
        setIsTransitioning(true);

        // 延迟3秒后跳转到比赛页面
        setTimeout(() => {
          router.push("/battle");
        }, 3000);
      });
    },
  });

  // 检查比赛状态，如果比赛已开始则直接跳转到比赛页面
  useEffect(() => {
    if (isMatchInProgress && !isTransitioning && !showCongratulations) {
      console.log("比赛已开始，跳转到比赛页面:", { matchStatus, matchId: currentMatchId });
      router.push("/battle");
    }
  }, [isMatchInProgress, isTransitioning, showCongratulations, matchStatus, currentMatchId, router]);

  useEffect(() => {
    const fetchMatchTime = async () => {
      const time = await getNextMatchTime();
      setNextMatchTime(time);
    };
    if (!nextMatchTime) {
      fetchMatchTime();
    }
  }, [setNextMatchTime, nextMatchTime]);

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* 比赛开始时显示选中的选手 */}
      {showCongratulations && selectedFighters && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-purple-900/90 to-cyan-900/90 border-2 border-cyan-400 p-8 rounded-lg backdrop-blur-lg text-center max-w-md mx-4">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">🎉 擂台双方确定！</h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-cyan-500/20 border border-cyan-400/50 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-cyan-400 mb-2">选手 A</h3>
                <Address address={selectedFighters.playerA} />
              </div>
              <div className="text-2xl">⚔️</div>
              <div className="p-4 bg-pink-500/20 border border-pink-400/50 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-pink-400 mb-2">选手 B</h3>
                <Address address={selectedFighters.playerB} />
              </div>
            </div>
            <p className="text-cyan-300 animate-pulse">3秒后进入比赛页面...</p>
          </div>
        </div>
      )}

      {!isTransitioning && (
        <>
          {/* 上方功能区域 - 弹性占据剩余空间 */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden">
            {/* 根据比赛状态显示不同内容 */}
            {isMatchInProgress ? (
              // 比赛进行中：答题擂台区域（待实现）
              <div className="w-full max-w-4xl h-full flex items-center justify-center">
                <div className="text-center text-cyan-400">
                  <h2 className="text-2xl font-bold mb-4">🔥 答题擂台区域</h2>
                  <p className="text-lg opacity-70">比赛正在进行中...</p>
                </div>
              </div>
            ) : (
              // 比赛未开始：倒计时+按钮+候选池
              <div className="w-full max-w-4xl h-full flex flex-col">
                {/* 用户操作按钮区域 */}
                <div className="mb-6 shrink-0">
                  <UserActionButtons />
                </div>

                {/* 候选池区域 - 占据剩余空间 */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CandidatePoolDisplay />
                </div>
              </div>
            )}
          </div>

          {/* 下方观众席区域 - 固定在底部 */}
          <div className="shrink-0 w-full border-t border-cyan-400/20">
            <div className="w-full max-w-6xl mx-auto h-48 sm:h-56">
              <AudienceSeating />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

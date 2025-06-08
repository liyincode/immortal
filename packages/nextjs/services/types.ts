export interface ImmortalBlockRecord {
  id: string; // 区块的唯一标识
  winnerName: string; // 胜利者名称
  matchDate: string; // 比赛日期
  originalRecord?: any; // 保存原始合约数据以备后用
}

// 可以创建一个 types.ts 文件，例如: services/types.ts 或 lib/types.ts
// 或者暂时直接在使用到的地方定义

export interface ImmortalBlockRecord {
  id: string; // 区块的唯一标识
  winnerName: string; // 胜利者名称
  matchDate: string; // 比赛日期
  originalRecord?: any; // 保存原始合约数据以备后用
  // 未来可以添加更多字段，如 txHash, specificMatchId 等
}

export interface MockUser {
  id: string; // 通常是钱包地址
  displayName: string; // ENS 名称或截断的地址
  avatarUrl?: string; // 可选的头像链接，或者我们可以用首字母/默认图标
}

export interface Seat {
  id: string; // 座位的唯一标识，例如 "row1-col3"
  row: number;
  col: number;
  isOccupied: boolean;
  occupant?: MockUser;
}

// services/mockContractService.ts
import { ImmortalBlockRecord, MockUser, Seat } from "./types";

export interface MockApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const getNextMatchTime = async (): Promise<Date> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  const now = new Date();
  // 假设下一场比赛在1小时后
  return new Date(now.getTime() + 1 * 60 * 60 * 1000);
};

export const registerAsFighter = async (userAddress: string): Promise<MockApiResponse> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Mock API: User ${userAddress} attempting to register as fighter.`);
  // 模拟成功/失败
  const isSuccess = Math.random() > 0.1; // 90% 成功率
  if (isSuccess) {
    return { success: true, message: "报名成功！请等待比赛开始。" };
  } else {
    return { success: false, message: "报名失败，擂台已满或发生未知错误。" };
  }
};

export const joinAsAudience = async (userAddress: string): Promise<MockApiResponse> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  console.log(`Mock API: User ${userAddress} attempting to join as audience.`);
  return { success: true, message: "欢迎加入观众席！" };
};

export const getImmortalChainRecords = async (limit: number = 7): Promise<ImmortalBlockRecord[]> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟

  const mockRecords: ImmortalBlockRecord[] = [];
  const names = ["Cypher", "Trinity", "ZeroCool", "AcidBurn", "Ghost", "NeonBlade", "Glitch"];
  const today = new Date();

  for (let i = 0; i < limit; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 7 - Math.floor(Math.random() * 5)); // 过去不同日期
    mockRecords.push({
      id: `block-${Date.now() - i * 1000000 - Math.floor(Math.random() * 100000)}`, // 唯一ID
      winnerName: names[Math.floor(Math.random() * names.length)],
      matchDate: date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }),
    });
  }
  return mockRecords.reverse(); // 让最新的在后面或前面，根据视觉决定
};

const mockEmojiAvatars = [
  // <--- 更新为表情符号
  "😀",
  "😎",
  "🚀",
  "🌟",
  "🤖",
  "👾",
  "💡",
  "🔥",
  "💡",
  "🥳",
  "🤯",
  "👽",
  "🧠",
  "🦊",
  "🦄",
  "👀",
];
const mockDisplayNames = [
  "Rocker_01",
  "FanGirlX",
  "SynthWaveFan",
  "CyberSeat77",
  "PixelPop",
  "BassDropper",
  "ZeroCool",
  "AcidBurn",
];

const generateMockUser = (idSuffix: string): MockUser => {
  const randomName = mockDisplayNames[Math.floor(Math.random() * mockDisplayNames.length)];
  const randomAvatar = mockEmojiAvatars[Math.floor(Math.random() * mockEmojiAvatars.length)]; // <--- 使用表情符号
  return {
    id: `0xUser${idSuffix}${Math.random().toString(16).substring(2, 6)}`,
    displayName: `${randomName}_${Math.random().toString(16).substring(2, 4)}`,
    avatarUrl: randomAvatar, // 字段名 avatarUrl 依然保留，但现在存储的是表情符号
  };
};
// --- End Mock User Generation ---

export const getAudienceSeats = async (rows: number = 5, cols: number = 10): Promise<Seat[]> => {
  await new Promise(resolve => setTimeout(resolve, 600)); // 模拟网络延迟
  const seats: Seat[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seatId = `seat-${r}-${c}`;
      const isOccupied = Math.random() < 0.3; // 30% 的座位被占用
      seats.push({
        id: seatId,
        row: r,
        col: c,
        isOccupied: isOccupied,
        occupant: isOccupied ? generateMockUser(`${r}-${c}`) : undefined,
      });
    }
  }
  return seats;
};

export const takeSeat = async (
  seatId: string,
  user: MockUser,
): Promise<{ success: boolean; message: string; updatedSeat?: Seat }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  // 在真实场景中，这里会与后端或智能合约交互
  console.log(`Mock API: User ${user.displayName} trying to take seat ${seatId}`);
  // 模拟成功/失败 (例如，座位刚刚被别人占了)
  if (Math.random() < 0.95) {
    // 95% 成功率
    return {
      success: true,
      message: `座位 ${seatId} 已为你预留！`,
      updatedSeat: {
        id: seatId,
        row: parseInt(seatId.split("-")[1]), // 假设的解析逻辑
        col: parseInt(seatId.split("-")[2]), // 假设的解析逻辑
        isOccupied: true,
        occupant: user,
      },
    };
  } else {
    return { success: false, message: "手慢了，这个座位刚被抢走！" };
  }
};

// services/store/matchStore.ts
import { create } from "zustand";
import type { MockUser } from "~~/services/types";

type UserRole = "idle" | "fighterCandidate" | "audience";
type RegistrationStatus = "idle" | "pending" | "success" | "error";

interface MatchState {
  nextMatchTime: Date | null;
  userRole: UserRole;
  registrationStatus: RegistrationStatus;
  registrationMessage: string;
  candidatePool: MockUser[]; // <--- 新增：候选池
  setNextMatchTime: (time: Date) => void;
  setUserRole: (role: UserRole, user?: MockUser) => void; // <--- 修改：setUserRole 可接收用户信息
  setRegistrationStatus: (status: RegistrationStatus, message?: string) => void;
  resetRegistration: () => void;
  addToCandidatePool: (user: MockUser) => void; // <--- 新增
  removeFromCandidatePool: (userId: string) => void; // <--- 新增
  clearCandidatePool: () => void; // <--- 新增 (比赛开始或重置时可能用到)
}

export const useMatchStore = create<MatchState>((set, get) => ({
  nextMatchTime: null,
  userRole: "idle",
  registrationStatus: "idle",
  registrationMessage: "",
  candidatePool: [], // <--- 初始化为空数组

  setNextMatchTime: time => set({ nextMatchTime: time }),

  // 修改 setUserRole 以便在切换角色时管理候选池
  setUserRole: (role, user) => {
    const currentRole = get().userRole;
    const currentPool = get().candidatePool;

    // 如果用户成为候选斗士
    if (role === "fighterCandidate" && user) {
      // 确保用户不在池中才添加
      if (!currentPool.find(p => p.id === user.id)) {
        set(state => ({ candidatePool: [...state.candidatePool, user] }));
      }
    }
    // 如果用户从候选斗士切换到其他角色 (例如观众或 idle)
    else if (currentRole === "fighterCandidate" && role !== "fighterCandidate" && user) {
      set(state => ({
        candidatePool: state.candidatePool.filter(p => p.id !== user.id),
      }));
    }
    // 如果用户从观众切换到候选斗士 (已在上面 fighterCandidate 逻辑中处理添加)
    // (此处可以添加从 AudienceSeating 移除的逻辑，如果需要的话)

    set({ userRole: role });
  },

  setRegistrationStatus: (status, message = "") => set({ registrationStatus: status, registrationMessage: message }),

  resetRegistration: () =>
    set({
      registrationStatus: "idle",
      userRole: "idle",
      registrationMessage: "" /* candidatePool 可能也需要重置，看逻辑 */,
    }),

  addToCandidatePool: user => {
    // 确保不重复添加
    if (!get().candidatePool.find(p => p.id === user.id)) {
      set(state => ({ candidatePool: [...state.candidatePool, user] }));
    }
  },

  removeFromCandidatePool: userId =>
    set(state => ({
      candidatePool: state.candidatePool.filter(user => user.id !== userId),
    })),

  clearCandidatePool: () => set({ candidatePool: [] }),
}));

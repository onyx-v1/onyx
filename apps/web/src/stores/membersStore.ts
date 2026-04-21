import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Member {
  id: string;
  username: string;
  displayName: string;
}

interface MembersState {
  members: Member[];
  fetchMembers: () => Promise<void>;
}

export const useMembersStore = create<MembersState>((set) => ({
  members: [],
  fetchMembers: async () => {
    try {
      const { data } = await apiClient.get<Member[]>('/community/members');
      set({ members: data });
    } catch {}
  },
}));

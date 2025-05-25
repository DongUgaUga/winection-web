import { create } from 'zustand';

type Store = {
	avatar: string;
	setAvatar: (time: string) => void;
};

export const useAvatarStore = create<Store>((set) => ({
	avatar: '',
	setAvatar: (ava) => set(() => ({ avatar: ava })),
}));

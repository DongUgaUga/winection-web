import { create } from 'zustand';

type Store = {
	startTime: string;
	setStartTime: (time: string) => void;
};

export const useStartTimeStore = create<Store>((set) => ({
	startTime: '',
	setStartTime: (time) => set(() => ({ startTime: time })),
}));

import { create } from 'zustand';

type Store = {
	deafAddress: string;
	setDeafAddress: (address: string) => void;
	deafPhoneNumber: string;
	setDeafPhoneNumber: (address: string) => void;
};

export const useDeafInfoStore = create<Store>((set) => ({
	deafAddress: '',
	setDeafAddress: (address) => set(() => ({ deafAddress: address })),
	deafPhoneNumber: '',
	setDeafPhoneNumber: (phoneNumber) =>
		set(() => ({ deafPhoneNumber: phoneNumber })),
}));

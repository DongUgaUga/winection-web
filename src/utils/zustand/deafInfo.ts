import { create } from 'zustand';

type Store = {
	deafAddress: string;
	setDeafAddress: (address: string) => void;
	deafLatitude: number;
	setDeafLatitude: (latitude: number) => void;
	deafLongitude: number;
	setDeafLongitude: (longitude: number) => void;
	deafPhoneNumber: string;
	setDeafPhoneNumber: (address: string) => void;
};

export const useDeafInfoStore = create<Store>((set) => ({
	deafAddress: '',
	setDeafAddress: (address) => set(() => ({ deafAddress: address })),
	deafLatitude: 0,
	setDeafLatitude: (latitude) => set(() => ({ deafLatitude: latitude })),
	deafLongitude: 0,
	setDeafLongitude: (longitude) => set(() => ({ deafLongitude: longitude })),
	deafPhoneNumber: '',
	setDeafPhoneNumber: (phoneNumber) =>
		set(() => ({ deafPhoneNumber: phoneNumber })),
}));

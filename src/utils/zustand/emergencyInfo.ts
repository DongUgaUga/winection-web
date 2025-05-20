import { create } from 'zustand';

type Store = {
	emergencyName: string;
	setEmergencyName: (name: string) => void;
	emergencyAddress: string;
	setEmergencyAddress: (address: string) => void;
	emergencyPhoneNumber: string;
	setEmergencyPhoneNumber: (address: string) => void;
};

export const useEmergencyInfoStore = create<Store>((set) => ({
	emergencyName: '',
	setEmergencyName: (name) => set(() => ({ emergencyName: name })),
	emergencyAddress: '',
	setEmergencyAddress: (address) => set(() => ({ emergencyAddress: address })),
	emergencyPhoneNumber: '',
	setEmergencyPhoneNumber: (phoneNumber) =>
		set(() => ({ emergencyPhoneNumber: phoneNumber })),
}));

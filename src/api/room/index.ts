import privateAxios from '../privateAxios';
import publicAxios from '../publicAxios';
import {
	RoomId,
	EmergencyLocationRequest,
	EmergencyLocationResponse,
} from './entity';

export const room = async (): Promise<RoomId> => {
	const { data } = await publicAxios.post<RoomId>('rooms');

	return data;
};

export const emergencyLocation = async (
	location: EmergencyLocationRequest,
): Promise<EmergencyLocationResponse> => {
	const { data } = await privateAxios.post<EmergencyLocationResponse>(
		'/emergency/location',
		location,
	);

	return data;
};

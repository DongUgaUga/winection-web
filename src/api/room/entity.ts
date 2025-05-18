export interface RoomId {
	room_id: string;
}

export interface EmergencyLocationRequest {
	latitude: number;
	longitude: number;
	emergency_type: string;
}

export interface EmergencyLocationResponse {
	message: string;
}

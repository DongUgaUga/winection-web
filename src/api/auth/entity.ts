export type UserClassification = '농인' | '청인' | '응급기관';

export type EmergencyOrganization = '병원' | '경찰서' | '소방서';

export interface SignupRequest {
	username: string;
	password: string;
	confirm_password: string;
	nickname: string;
	phone_number: string;
	user_type: UserClassification;
	emergency_type?: EmergencyOrganization;
	address?: string;
	organization_name?: string;
	latitude?: number;
	longitude?: number;
}

export interface LoginRequest {
	username: string;
	password: string;
}

export interface MeResponse {
	id: number;
	username: string;
	nickname: string;
	user_type: UserClassification;
	phone_number: string;
	emergency_type?: EmergencyOrganization;
	address?: string;
	organization_name?: string;
	latitude?: string;
	longitude?: string;
	emergency_code?: string;
}

export interface NicknameCheckRequest {
	nickname: string;
}

export interface PasswordFindRequest {
	username: string;
	phone_number: string;
}

export interface PasswordChangeRequest {
	username: string;
	new_password: string;
	confirm_password: string;
}

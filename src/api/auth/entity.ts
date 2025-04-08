export type UserClassification = '농인' | '일반인' | '응급기관';

export type EmergencyOrganization = '병원' | '경찰서' | '소방서';

export interface SignupRequest {
  username: string;
  password: string;
  confirm_password: string;
  nickname: string;
  user_type: UserClassification;
  emergency_type?: EmergencyOrganization;
  address?: string;
  organization_name?: string;
}

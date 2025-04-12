import privateAxios from '../privateAxios';
import publicAxios from '../publicAxios';
import { LoginRequest, SignupRequest, MeResponse } from './entity';

export const signup = async (userData: SignupRequest) => {
  const { data } = await publicAxios.post(
    '/register',
    userData
  );

  return data;
};

export const login = async (loginData: LoginRequest) => {
  const { data } = await publicAxios.post(
    '/login',
    loginData
  );

  return data;
}

export const getMe = async (): Promise<MeResponse> => {
  const { data } = await privateAxios.get<MeResponse>(
    '/me',
  );

  return data;
}

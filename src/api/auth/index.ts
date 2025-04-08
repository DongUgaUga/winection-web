import api from '..';
import { LoginRequest, SignupRequest } from './entity';

export const signup = async (userData: SignupRequest) => {
  const { data } = await api.post(
    '/register',
    userData
  );

  return data;
};

export const login = async (loginData: LoginRequest) => {
  const { data } = await api.post(
    '/login',
    loginData
  );

  return data;
}

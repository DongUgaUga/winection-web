import api from '..';
import { SignupRequest } from './entity';

export const signup = async (userData: SignupRequest) => {
  const { data } = await api.post(
    '/register',
    userData
  );

  return data;
};

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function useLogout() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const logout = () => {
		localStorage.removeItem('accessToken');
		queryClient.removeQueries({ queryKey: ['userInfo'] });
		navigate('/');
	};

	return logout;
}

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function useLogout() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const logout = () => {
		localStorage.removeItem('accessToken');
		queryClient.removeQueries({ queryKey: ['userInfo'] });
		if (window.location.pathname === '/') {
			navigate(0); // 현재 경로에서 새로고침
		} else {
			navigate('/');
		}
	};

	return logout;
}

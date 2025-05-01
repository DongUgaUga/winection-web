import axios from 'axios';
import useTokenState from '../hooks/useTokenState';

const privateAxios = axios.create({
	baseURL: `https://${import.meta.env.VITE_SERVER_URL}`,
});

privateAxios.interceptors.request.use((config) => {
	const token = useTokenState();

	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

privateAxios.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('accessToken');
			window.location.href = '/auth';

			return Promise.reject(error);
		}

		return Promise.reject(error);
	},
);

export default privateAxios;

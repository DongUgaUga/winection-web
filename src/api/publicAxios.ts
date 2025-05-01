import axios from 'axios';

const publicAxios = axios.create({
	baseURL: `https://${import.meta.env.VITE_SERVER_URL}`,
});

export default publicAxios;

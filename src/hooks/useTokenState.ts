export default function useTokenState() {
	const token = localStorage.getItem('accessToken');

	return token;
}

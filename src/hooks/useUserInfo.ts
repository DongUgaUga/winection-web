import { useSuspenseQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import useTokenState from './useTokenState';

export default function useUserInfo() {
	const token = useTokenState();

	const { data } = useSuspenseQuery({
		queryKey: ['userInfo', token],
		queryFn: () => (token ? getMe() : null),
		staleTime: 1000 * 60 * 10, // 10 minutes
		gcTime: 1000 * 60 * 60, // 1 hour
		refetchOnWindowFocus: false,
	});

	return { data };
}

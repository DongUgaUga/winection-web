import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { checkNicknameDuplicate } from '../../../../api/auth';

export default function useCheckNickname() {
	const { mutate, isError } = useMutation({
		mutationFn: (nickname: string) =>
			checkNicknameDuplicate({ nickname: nickname }),

		onSuccess: () => toast('사용 가능한 닉네임입니다.', { type: 'success' }),

		onError: () => toast('이미 사용 중인 닉네임입니다.', { type: 'error' }),
	});

	return { mutate, isError };
}

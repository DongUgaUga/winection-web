import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { findPassword } from '../../../../api/auth';
import { PasswordFindRequest } from '../../../../api/auth/entity';

export default function useFindPassword() {
	const { mutateAsync, isError } = useMutation({
		mutationFn: (data: PasswordFindRequest) => findPassword(data),

		onError: () => toast('일치하는 회원 정보가 없습니다.', { type: 'error' }),
	});

	return { mutateAsync, isError };
}

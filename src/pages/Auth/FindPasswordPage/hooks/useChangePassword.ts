import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../../../../api/auth';
import { PasswordChangeRequest } from '../../../../api/auth/entity';

export default function useChangePassword() {
	const { mutateAsync } = useMutation({
		mutationFn: (data: PasswordChangeRequest) => changePassword(data),
	});

	return { mutateAsync };
}

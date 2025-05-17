import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../../api/auth';
// import { toast } from "react-toastify";

export default function useLogin() {
	const navigate = useNavigate();

	const { mutate, isError } = useMutation({
		mutationFn: login,

		onSuccess: (data) => {
			localStorage.setItem('accessToken', data.token);
			navigate('/');
		},

		onError: () => {
			// toast("아이디 또는 비밀번호를 다시 확인해 주세요.", { type: "error"});
		},
	});

	return { mutate, isError };
}

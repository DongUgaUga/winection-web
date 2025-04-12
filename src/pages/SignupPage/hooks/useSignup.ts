import { useMutation } from "@tanstack/react-query";
import { signup } from "../../../api/auth";
import { toast } from 'react-toastify';
import useLogin from "./useLogin";

export default function useSignup() {

  const { mutate: login } = useLogin();

  const { mutate } = useMutation({
    mutationFn: signup,

    onSuccess: (_data, variables) => {
      login({
        username: variables.username,
        password: variables.password,
      })
      toast(_data.message, { type: "success" });
    },

    onError: (error: Error | any) => {
      console.log(error);
      if (error.response.data.detail) {
        toast((error.response.data.detail), { type: "error" });
      } else {
        toast('회원가입에 실패했습니다.', { type: 'error' });
      }
    }
  })

  return { mutate };
}

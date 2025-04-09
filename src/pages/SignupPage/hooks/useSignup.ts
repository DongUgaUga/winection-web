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
      toast("회원가입에 성공했습니다.", { type: "success" });
    },

    onError: () => {
      toast("회원가입에 실패했습니다.", { type: "error" });
    }
  })

  return { mutate };
}

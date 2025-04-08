import { useMutation } from "@tanstack/react-query";
import { signup } from "../../../api/auth";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

export default function useSignup() {
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: signup,

    onSuccess: (data) => {
      toast("회원가입에 성공했습니다.", { type: "success" });
      sessionStorage.setItem('userInfo', JSON.stringify(data)); // 로그인 판단 여부
      navigate('/');
    },

    onError: () => {
      toast("회원가입에 실패했습니다.", { type: "error" });
    }
  })

  return { mutate };
}

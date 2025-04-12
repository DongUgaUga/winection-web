import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";
import useTokenState from "./useTokenState";

export default function useUserInfo() {
  const token = useTokenState();

  const { data } = useQuery({
    queryKey: ['me'],

    queryFn: getMe,

    enabled: !!token,
  })

  return { data };
}

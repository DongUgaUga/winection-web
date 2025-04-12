import { useSuspenseQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";
import useTokenState from "./useTokenState";

export default function useUserInfo() {
  const token = useTokenState();

  const { data } = useSuspenseQuery({
    queryKey: ['userInfo', token],

    queryFn: () => (token ? getMe() : null),
  })

  return { data };
}

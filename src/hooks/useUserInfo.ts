import { useSuspenseQuery } from "@tanstack/react-query";
import { getMe } from "../api/auth";

export default function useUserInfo() {
  const { data } = useSuspenseQuery({
    queryKey: ['me'],

    queryFn: getMe,
  })

  return { data };
}
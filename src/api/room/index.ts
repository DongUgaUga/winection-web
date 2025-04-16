import publicAxios from "../publicAxios"
import { RoomId } from "./entity";

export const room = async (): Promise<RoomId> => {
  const { data } = await publicAxios.post<RoomId>(
    'rooms'
  );

  return data;
}

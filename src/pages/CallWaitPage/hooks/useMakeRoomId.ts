import { useMutation } from '@tanstack/react-query';
import { room } from '../../../api/room';

export default function useMakeRoomId() {
	const { mutateAsync } = useMutation({
		mutationFn: room,
	});

	return { mutateAsync };
}

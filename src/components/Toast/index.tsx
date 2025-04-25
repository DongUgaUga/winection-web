import { useEffect } from 'react';

export default function Toast({
	setToast,
	text,
}: {
	setToast: React.Dispatch<React.SetStateAction<boolean>>;
	text: string;
}) {
	useEffect(() => {
		const timer = setTimeout(() => {
			setToast(false);
		}, 1500);

		return () => {
			clearTimeout(timer);
		};
	}, [setToast]);

	return <p>{text}</p>;
}

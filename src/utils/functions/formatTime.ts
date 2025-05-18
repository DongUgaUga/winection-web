// 시간 포맷 (예: 00:02:15)
export const formatTime = (seconds: number, type: 'digit' | 'korean') => {
	const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
	const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
	const s = String(seconds % 60).padStart(2, '0');
	if (type === 'digit') {
		return `${h}:${m}:${s}`;
	}

	if (type === 'korean') {
		if (h === '00' && m === '00') {
			return `${s}초`;
		}
		if (h === '00') {
			return `${m}분 ${s}초`;
		}
		return `${h} ${m}분 ${s}초`;
	}

	return '0';
};

// 2025-05-17T22:05:36+09:00 -
export const formatKoreanDate = (
	date: string,
	type: 'digit' | 'korean',
): string => {
	if (!date) return '';
	const year = date.slice(0, 4);
	const month = date.slice(5, 7);
	const day = date.slice(8, 10);

	const hour = date.slice(11, 13);
	const minute = date.slice(14, 16);

	if (type === 'digit') {
		return `${year}.${month}.${day}  ${hour}:${minute}`;
	}

	return `${year}년 ${month}월 ${day}일   ${hour}시 ${minute}분`;
};

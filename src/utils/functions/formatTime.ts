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

export const formatKoreanDate = (
	date: Date | null,
	type: 'digit' | 'korean',
): string => {
	if (!date) return '';
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based month
	const day = String(date.getDate()).padStart(2, '0');

	const hour = String(date.getHours()).padStart(2, '0');
	const minute = String(date.getMinutes()).padStart(2, '0');

	if (type === 'digit') {
		return `${year}.${month}.${day}  ${hour}:${minute}`;
	}

	return `${year}년 ${month}월 ${day}일   ${hour}시 ${minute}분`;
};

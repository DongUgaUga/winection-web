declare global {
	interface Window {
		naver: any;
	}
}

export default function useGeocode(
	address: string,
): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (!window.naver?.maps?.Service) {
			reject('네이버 지도 API가 로드되지 않았습니다.');
			return;
		}

		window.naver.maps.Service.geocode(
			{ query: address },
			(status: any, response: any) => {
				if (status !== window.naver.maps.Service.Status.OK) {
					reject('주소 변환 실패');
					return;
				}

				const result = response.v2.addresses[0];
				resolve({
					lat: parseFloat(result.y),
					lng: parseFloat(result.x),
				});
			},
		);
	});
}

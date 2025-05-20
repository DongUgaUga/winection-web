import { useEffect, useRef } from 'react';

declare global {
	interface Window {
		naver: any;
	}
}

interface NaverMapProps {
	onLocationUpdate?: (info: {
		lat: number;
		lng: number;
		roadAddress: string;
		jibunAddress: string;
	}) => void;
	coordinates?: { lat: number; lng: number };
	address?: string;
}

export default function NaverMap({
	onLocationUpdate,
	coordinates,
	address,
}: NaverMapProps) {
	const mapElement = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVERMAP_CLIENT_ID}&submodules=geocoder`;
		script.async = true;

		script.onload = () => {
			let retryCount = 0;
			const maxRetries = 10;
			const interval = 300;

			const initializeMap = () => {
				if (
					!window.naver ||
					!window.naver.maps ||
					!window.naver.maps.Service ||
					!mapElement.current
				) {
					retryCount++;
					if (retryCount > maxRetries) {
						console.warn('🛑 네이버 지도 SDK 로드 불완전 - 최대 재시도 초과');
						return;
					}
					console.warn('🕒 네이버 지도 SDK 준비 중... 재시도 중');
					setTimeout(initializeMap, interval);
					return;
				}

				const map = new window.naver.maps.Map(mapElement.current, {
					center: new window.naver.maps.LatLng(37.5665, 126.978),
					zoom: 16,
					zoomControl: true,
					zoomControlOptions: {
						position: window.naver.maps.Position.RIGHT_BOTTOM,
						style: window.naver.maps.ZoomControlStyle.SMALL,
						legendDisabled: true,
					},
				});

				const geocoder = window.naver.maps.Service;

				if (coordinates) {
					const userLatLng = new window.naver.maps.LatLng(
						coordinates.lat,
						coordinates.lng,
					);
					map.setCenter(userLatLng);

					new window.naver.maps.Marker({
						position: userLatLng,
						map,
						title: '선택 위치',
					});

					geocoder.reverseGeocode(
						{
							coords: userLatLng,
							orders: [
								window.naver.maps.Service.OrderType.ROAD_ADDR,
								window.naver.maps.Service.OrderType.ADDR,
							],
						},
						function (status: any, response: any) {
							if (status === window.naver.maps.Service.Status.OK) {
								const result = response.v2.address;
								onLocationUpdate?.({
									lat: coordinates.lat,
									lng: coordinates.lng,
									roadAddress: result.roadAddress || '',
									jibunAddress: result.jibunAddress || '',
								});
								console.log('결과', result);
							} else {
								console.log('geocoder 실패', status, response);
							}
						},
					);
				} else if (address) {
					geocoder.geocode(
						{
							query: address,
						},
						function (status: any, response: any) {
							if (status === window.naver.maps.Service.Status.OK) {
								console.log(response);
								const item = response.v2.addresses[0];
								if (!item) {
									console.log('주소를 찾을 수 없습니다.');
									return;
								}
								const point = new window.naver.maps.Point(item.x, item.y);
								const latlng = new window.naver.maps.LatLng(point.y, point.x);
								map.setCenter(latlng);

								new window.naver.maps.Marker({
									position: latlng,
									map,
									title: '검색 위치',
								});

								geocoder.reverseGeocode(
									{
										coords: latlng,
										orders: [
											window.naver.maps.Service.OrderType.ROAD_ADDR,
											window.naver.maps.Service.OrderType.ADDR,
										],
									},
									function (status2: any, response2: any) {
										if (status2 === window.naver.maps.Service.Status.OK) {
											const result = response2.v2.address;
											onLocationUpdate?.({
												lat: latlng.lat(),
												lng: latlng.lng(),
												roadAddress: result.roadAddress || '',
												jibunAddress: result.jibunAddress || '',
											});
										} else {
											console.log('reverse geocoder 실패', status2, response2);
										}
									},
								);
							} else {
								console.log('geocode 실패', status, response);
							}
						},
					);
				} else {
					// Neither coordinates nor address provided; try to get current location
					navigator.geolocation?.getCurrentPosition(
						(position) => {
							const { latitude, longitude } = position.coords;
							const userLatLng = new window.naver.maps.LatLng(
								latitude,
								longitude,
							);

							map.setCenter(userLatLng);

							new window.naver.maps.Marker({
								position: userLatLng,
								map,
								title: '현재 위치',
							});

							geocoder.reverseGeocode(
								{
									coords: userLatLng,
									orders: [
										window.naver.maps.Service.OrderType.ROAD_ADDR,
										window.naver.maps.Service.OrderType.ADDR,
									],
								},
								function (status: any, response: any) {
									if (status === window.naver.maps.Service.Status.OK) {
										const result = response.v2.address;
										onLocationUpdate?.({
											lat: latitude,
											lng: longitude,
											roadAddress: result.roadAddress || '',
											jibunAddress: result.jibunAddress || '',
										});
									} else {
										console.log('geocoder 실패', status, response);
									}
								},
							);
						},
						(err) => console.error('위치 가져오기 실패', err),
					);
				}
			};

			initializeMap();
		};

		document.head.appendChild(script);
		return () => {
			document.head.removeChild(script);
		};
	}, [coordinates, address, onLocationUpdate]);

	return (
		<div
			ref={mapElement}
			style={{ width: '100%', height: '100%', borderRadius: '16px' }}
		/>
	);
}

import { useEffect, useRef } from 'react';

declare global {
	interface Window {
		naver: any;
	}
}

interface NaverMapProps {
	onLocationUpdate: (info: {
		lat: number;
		lng: number;
		roadAddress: string;
		jibunAddress: string;
	}) => void;
}

export default function NaverMap({ onLocationUpdate }: NaverMapProps) {
	const mapElement = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVERMAP_CLIENT_ID}&submodules=geocoder`;
		script.async = true;

		script.onload = () => {
			if (!window.naver || !mapElement.current) return;

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

			navigator.geolocation?.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					const userLatLng = new window.naver.maps.LatLng(latitude, longitude);

					map.setCenter(userLatLng);

					new window.naver.maps.Marker({
						position: userLatLng,
						map,
						title: '현재 위치',
					});

					const geocoder = window.naver.maps.Service;
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
								// console.log(result); // { jibunAddress: "~~", roadAddress: "~~" }
								onLocationUpdate({
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
		};

		document.head.appendChild(script);
		return () => {
			document.head.removeChild(script);
		};
	}, []);

	return <div ref={mapElement} style={{ width: '100%', height: '100%' }} />;
}

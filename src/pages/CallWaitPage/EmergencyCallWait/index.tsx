import { useState, useRef } from 'react';
import { cn } from '@bcsdlab/utils';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ActiveCallIcon from 'src/assets/call-active.svg';
import CallIcon from 'src/assets/call.svg';
import GrandfatherAvatar from 'src/assets/grandfather-avatar.svg';
import styles from './EmergencyCallWait.module.scss';
import type { EmergencyLocationRequest } from '@/api/room/entity';
import { emergencyLocation } from '@/api/room';

const AGENCIES = ['병원', '경찰서', '소방서'];

function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
	return new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject('Geolocation을 지원하지 않는 브라우저입니다.');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				resolve({ lat: latitude, lng: longitude });
			},
			(error) => {
				reject(`위치 정보 가져오기 실패: ${error.message}`);
			},
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
		);
	});
}

function connectNearAgency() {
	const { mutateAsync } = useMutation({
		mutationFn: (location: EmergencyLocationRequest) =>
			emergencyLocation(location),

		onError: (error: AxiosError) => {
			if (error.status === 400) {
				toast('농인만 사용 가능한 기능입니다.', { type: 'error' });
			} else if (error.status === 404) {
				toast('해당 유형의 응급기관이 없습니다.', { type: 'error' });
			} else {
				toast('오류가 발생했습니다.', { type: 'error' });
			}
		},
	});

	return { mutateAsync };
}

export default function EmergencyCallWait() {
	const navigate = useNavigate();
	const [agency, setAgency] = useState('');
	const [isChecked, setIsChecked] = useState(false);
	const [isWaiting, setIsWaiting] = useState(false);

	// WebSocket instance for 농인 입장
	const socketRef = useRef<WebSocket | null>(null);

	const selectAgency = (value: string) => {
		setAgency(value);
	};

	const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
		setIsChecked(e.target.checked);
	};

	const { mutateAsync } = connectNearAgency();

	// 근처 기관 코드 받을 수 있는 소켓 통신 구현되면 변경 예정
	// 백으로 가장 가까운 기관 post요청(사용자 위치 정보). 해당 기관의 방 코드로 아동하기
	const connect = async () => {
		const myLocation = await getCurrentLocation();
		const nearAgency = await mutateAsync({
			latitude: myLocation.lat,
			longitude: myLocation.lng,
			emergency_type: agency,
		});

		const emergencyCode = nearAgency.message;

		const token = localStorage.getItem('accessToken');

		const socket = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/waitqueue/${emergencyCode}?token=${token}`,
		);
		socketRef.current = socket;

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'startCall') {
				const { organization_name, address, latitude, longitude, start_time } =
					data.data;
				setIsWaiting(false);

				navigate(`/emergency-call/${emergencyCode}`, {
					state: {
						organization_name,
						address,
						latitude,
						longitude,
						start_time,
					},
				});
			}
		};

		socket.onopen = () => {
			console.log('✅ 농인 WebSocket 연결 완료');
			setIsWaiting(true);
		};

		socket.onerror = (e) => {
			console.error('❌ WebSocket 연결 오류', e);
		};

		socket.onclose = () => {
			console.log('🛑 WebSocket 연결 종료');
		};
	};

	return (
		<div className={styles.container}>
			{!isWaiting ? (
				<>
					<div className={styles.help}>
						<div className={styles.help__description}>
							<div className={styles['help__description--main']}>
								도움이 필요한 기관을 선택해 주세요.
							</div>
							<div className={styles['help__description--sub']}>
								클릭 시, 가장 가까운 기관으로 연결됩니다.
							</div>
						</div>
						<div className={styles.agencies}>
							{AGENCIES.map((value) => (
								<div className={styles.agencies__agency}>
									<GrandfatherAvatar />
									<button
										className={cn({
											[styles['agencies__agency--button']]: true,
											[styles['agencies__agency--button--selected']]:
												value === agency,
										})}
										onClick={() => selectAgency(value)}
									>
										{value}
									</button>
								</div>
							))}
						</div>
					</div>
					<label htmlFor="agree" className={styles.checkbox}>
						<input
							id="agree"
							type="checkbox"
							className={styles.checkbox__check}
							checked={isChecked}
							onChange={handleCheck}
						/>
						<div className={styles.checkbox__agree}>
							참가하면 위치 정보 어쩌고에 동의
						</div>
					</label>
					<div
						className={cn({
							[styles.connect]: true,
							[styles['connect--able']]: !!agency,
						})}
					>
						{!!agency && isChecked ? <ActiveCallIcon /> : <CallIcon />}
						<button
							className={cn({
								[styles.connect__button]: true,
								[styles['connect__button--able']]: !!agency && isChecked,
							})}
							disabled={!agency && !isChecked}
							onClick={connect}
						>
							연결하기
						</button>
					</div>
				</>
			) : (
				<div>대기 중...</div>
			)}
		</div>
	);
}

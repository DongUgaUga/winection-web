import { useState, useRef, useEffect } from 'react';
import { cn } from '@bcsdlab/utils';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import doctor from 'src/assets/avatar/doctor.png';
import firefighter from 'src/assets/avatar/firefighter.png';
import police from 'src/assets/avatar/police.png';
import ActiveCallIcon from 'src/assets/call-active.svg';
import CallIcon from 'src/assets/call.svg';
import styles from './EmergencyCallWait.module.scss';
import type { EmergencyLocationRequest } from '@/api/room/entity';
import { emergencyLocation } from '@/api/room';
import useTokenState from '@/hooks/useTokenState';
import { useEmergencyInfoStore } from '@/utils/zustand/emergencyInfo';

const AGENCIES = [
	{
		name: '병원',
		src: doctor,
	},
	{
		name: '경찰서',
		src: police,
	},
	{
		name: '소방서',
		src: firefighter,
	},
];

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
	const token = useTokenState();
	const [agency, setAgency] = useState('');
	const [isChecked, setIsChecked] = useState(false);
	const [isWaiting, setIsWaiting] = useState(false);
	const [waitingTime, setWaitingTime] = useState(0);
	const { setEmergencyName, setEmergencyAddress, setEmergencyPhoneNumber } =
		useEmergencyInfoStore();

	useEffect(() => {
		if (!isWaiting) return;

		const interval = setInterval(() => {
			setWaitingTime((prev) => prev + 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [isWaiting]);

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

		const socket = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/waitqueue/${nearAgency.message}?token=${token}`,
		);
		socketRef.current = socket;

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			if (data.type === 'startCall') {
				const {
					organization_name,
					address,
					phone_number,
					latitude,
					longitude,
					start_time,
				} = data.data;
				setIsWaiting(false);
				setEmergencyName(organization_name);
				setEmergencyAddress(address);
				setEmergencyPhoneNumber(phone_number);

				navigate(`/emergency-call/${nearAgency.message}`, {
					state: {
						organization_name,
						address,
						phone_number,
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

	const cancelConnect = () => {
		const socket = socketRef.current;
		if (!socket || socket.readyState !== WebSocket.OPEN) {
			console.warn('🚫 WebSocket이 아직 연결되지 않았거나 종료됨');
			return;
		}

		socket.send(
			JSON.stringify({
				type: 'quitCall',
			}),
		);

		socket.close();
		setIsWaiting(false);
		setWaitingTime(0);
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
								<div className={styles.agencies__agency} key={value.name}>
									<img src={value.src} alt={`${value.name} avatar`} />
									<button
										className={cn({
											[styles['agencies__agency--button']]: true,
											[styles['agencies__agency--button--selected']]:
												value.name === agency,
										})}
										onClick={() => selectAgency(value.name)}
									>
										{value.name}
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
							개인 위치 정보 수집 및 이용에 동의합니다.
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
				<div className={styles['wait-container']}>
					<div className={styles['wait-container__title']}>
						<div className={styles['wait-container__title--main']}>
							연결 중입니다...
						</div>
						<div className={styles['wait-container__title--sub']}>
							잠시만 기다려 주세요.
						</div>
					</div>
					<div className={styles['wait-container__time']}>
						대기 시간 {waitingTime}초
					</div>
					<button
						className={styles['wait-container__button']}
						onClick={cancelConnect}
					>
						취소
					</button>
				</div>
			)}
		</div>
	);
}

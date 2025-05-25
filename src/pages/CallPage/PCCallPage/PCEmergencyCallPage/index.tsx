// import { useState } from "react";
import { useCallback, useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useNavigate, useParams } from 'react-router-dom';
import CameraBlockIcon from 'src/assets/block-camera.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CameraIcon from 'src/assets/camera.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import MicIcon from 'src/assets/mic.svg';
import videoLoading from 'src/assets/video-loading.json';
import { formatTime } from '../../../../utils/functions/formatTime';
import EmergencyReportModal from '../../components/EmergencyReportModal';
import DeafVideo from '../components/DeafVideo';
import Video from '../components/Video';
import styles from './PCEmergencyCallPage.module.scss';
import useTokenState from '@/hooks/useTokenState';
import useUserInfo from '@/hooks/useUserInfo';
import { useAvatarStore } from '@/utils/zustand/avatar';
import { useDeafInfoStore } from '@/utils/zustand/deafInfo';

export default function PCEmergencyCallPage() {
	const params = useParams();
	const navigate = useNavigate();
	const { data: userInfo } = useUserInfo();
	const { setDeafPhoneNumber } = useDeafInfoStore();
	const { setAvatar } = useAvatarStore();

	const [isMicActive, setIsMicActive] = useState(true);
	const [isCameraActive, setIsCameraActive] = useState(true);

	const [peerStatus, setPeerStatus] = useState(false);
	const [callTime, setCallTime] = useState(0);
	const lastCallTimeRef = useRef(0);
	const intervalRef = useRef<number | null>(null); // setInterval ID 저장

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalUserDetailInfo, setModalUserDetailInfo] = useState<{
		userId: number;
		nickname: string;
		phoneNumber: string;
		latitude: number;
		longitude: number;
	} | null>(null);

	const emergencySocketRef = useRef<WebSocket | null>(null);

	const token = useTokenState();

	const isDeaf = userInfo?.user_type === '농인';

	const updateCallTime = useCallback(() => {
		setCallTime((prev) => {
			const newTime = prev + 1;
			lastCallTimeRef.current = newTime;
			return newTime;
		});
	}, []);

	const handleLeave = useCallback(() => {
		console.log('📦 leave 수신 → readyCall 다시 보냄');
		if (emergencySocketRef.current?.readyState === WebSocket.OPEN) {
			emergencySocketRef.current.send(JSON.stringify({ type: 'readyCall' }));
		}
	}, []);

	useEffect(() => {
		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/emergency/${params.code}?token=${token}`,
		);
		emergencySocketRef.current = ws;

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'requestCall') {
				const { nickname, phone_number, location, user_id } = data.data;
				setModalUserDetailInfo((prev) => {
					if (
						prev?.userId === user_id &&
						prev?.phoneNumber === phone_number &&
						prev?.latitude === location.latitude &&
						prev?.longitude === location.longitude
					) {
						return prev; // 변경 없음 → 리렌더 방지
					}
					return {
						userId: user_id,
						nickname,
						phoneNumber: phone_number,
						latitude: location.latitude,
						longitude: location.longitude,
					};
				});
				setDeafPhoneNumber(phone_number);
				setIsModalOpen(true);
			}
			if (data.type === 'cancelCall') {
				setIsModalOpen(false);

				if (emergencySocketRef.current?.readyState === WebSocket.OPEN) {
					emergencySocketRef.current.send(
						JSON.stringify({ type: 'readyCall' }),
					);
				}
			}
		};

		return () => {
			ws.close();
		};
	}, [params.code]);

	const handleMic = () => {
		setIsMicActive((state) => !state);
	};

	const handleVideo = () => {
		setIsCameraActive((state) => !state);
	};

	const endCall = () => {
		navigate('/call-end', {
			state: {
				callTime: formatTime(lastCallTimeRef.current, 'korean'),
			},
		});
	};

	useEffect(() => {
		if (peerStatus) {
			intervalRef.current = window.setInterval(updateCallTime, 1000);
		}

		// cleanup: 나갈 때나 peerStatus가 false일 때 인터벌 제거
		return () => {
			if (intervalRef.current) {
				setCallTime(0);
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [peerStatus]);

	useEffect(() => {
		if (userInfo?.emergency_type) {
			setAvatar(userInfo.emergency_type);
		}
	}, [userInfo]);

	return (
		<div className={styles.container}>
			<div>
				<div>
					<div className={styles['video-chat__box']}>
						<div className={styles['video-chat__controls']}>
							<div>
								<button
									className={styles['video-chat__controls--button']}
									onClick={handleVideo}
								>
									{isCameraActive ? <CameraIcon /> : <CameraBlockIcon />}
								</button>
								<button
									className={styles['video-chat__controls--button']}
									onClick={handleMic}
								>
									{isMicActive ? <MicIcon /> : <MicBlockIcon />}
								</button>
							</div>
							{peerStatus ? (
								<div className={styles['call-time']}>
									<div className={styles['call-time__recording']}></div>
									<div className={styles['call-time__time']}>
										{formatTime(callTime, 'digit')}
									</div>
								</div>
							) : (
								<div className={styles['connect-wait']}>
									<Lottie
										animationData={videoLoading}
										className={styles['loading-spinner']}
									/>
									<div className={styles['connect-wait__text']}>
										상대방의 접속을 기다리고 있습니다.
									</div>
								</div>
							)}

							<button
								className={styles['video-chat__controls--button']}
								onClick={endCall}
							>
								<CallEndIcon />
							</button>
						</div>
						{isDeaf ? (
							<DeafVideo
								peerStatus={peerStatus}
								setPeerStatus={setPeerStatus}
								code={params.code!}
								isCameraActive={isCameraActive}
								isMicActive={isMicActive}
								onLeave={handleLeave}
								callType="emergency"
							/>
						) : (
							<Video
								peerStatus={peerStatus}
								setPeerStatus={setPeerStatus}
								code={params.code!}
								isCameraActive={isCameraActive}
								isMicActive={isMicActive}
								onLeave={handleLeave}
								callType="emergency"
							/>
						)}
					</div>
				</div>
			</div>
			{isModalOpen && modalUserDetailInfo && (
				<EmergencyReportModal
					setIsModalOpen={setIsModalOpen}
					userDetailInfo={modalUserDetailInfo}
					socket={emergencySocketRef.current}
				/>
			)}
		</div>
	);
}

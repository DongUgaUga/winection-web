// import { useState } from "react";
import { useEffect, useRef, useState } from 'react';
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
import Video from '../components/Video';
import styles from './PCEmergencyCallPage.module.scss';

export default function PCEmergencyCallPage() {
	const params = useParams();
	const navigate = useNavigate();

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

	const token = localStorage.getItem('accessToken');

	useEffect(() => {
		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/emergency/${params.code}?token=${token}`,
		);
		emergencySocketRef.current = ws;

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'requestCall') {
				const { nickname, phone_number, location, user_id } = data.data;
				setModalUserDetailInfo({
					userId: user_id,
					nickname,
					phoneNumber: phone_number,
					latitude: location.latitude,
					longitude: location.longitude,
				});
				setIsModalOpen(true);
			}
		};

		return () => ws.close();
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
			intervalRef.current = window.setInterval(() => {
				setCallTime((prev) => {
					const newTime = prev + 1;
					lastCallTimeRef.current = newTime;
					return newTime;
				});
			}, 1000);
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
										style={{ width: '17px', height: '17px' }}
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
						{params.code ? (
							<Video
								peerStatus={peerStatus}
								setPeerStatus={setPeerStatus}
								code={params.code}
								isCameraActive={isCameraActive}
								isMicActive={isMicActive}
								callType="emergency"
							/>
						) : (
							<div>올바르지 않은 경로입니다.</div>
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

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

	const [isModalOpen, setIsModalOpen] = useState(false);
	const intervalRef = useRef<number | null>(null); // setInterval ID 저장

	const handleMic = () => {
		setIsMicActive((state) => !state);
	};

	const handleVideo = () => {
		setIsCameraActive((state) => !state);
	};

	const endCall = () => {
		navigate('/call-end', {
			state: {
				callTime: formatTime(callTime, 'korean'),
			},
		});
	};

	// todo 소켓 통신으로 백에서 신고 접수 들어오면 자동으로 열게 하기
	// 그리고 사용자 정보 다 모달 컴포넌트에 전달
	const openModal = () => {
		setIsModalOpen(true);
	};

	useEffect(() => {
		if (peerStatus) {
			intervalRef.current = window.setInterval(() => {
				setCallTime((prev) => prev + 1);
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
			{isModalOpen && <EmergencyReportModal setIsModalOpen={setIsModalOpen} />}
			<button onClick={openModal}>테스트용 신고접수 모달 열기</button>
		</div>
	);
}

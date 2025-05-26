// import { useState } from "react";
import { useCallback, useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
import { useDeafInfoStore } from '@/utils/zustand/deafInfo';

export default function PCEmergencyCallPage() {
	const params = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const token = useTokenState();
	const { data: userInfo } = useUserInfo();
	const { setDeafPhoneNumber } = useDeafInfoStore();
	const type = userInfo?.emergency_type || location.state;

	const [isMicActive, setIsMicActive] = useState(true);
	const isMicActiveRef = useRef(isMicActive);
	const [isCameraActive, setIsCameraActive] = useState(true);

	const [recognition, setRecognition] = useState<any>(null);
	const [isListening, setIsListening] = useState(false);

	const [peerStatus, setPeerStatus] = useState(false);
	const [callTime, setCallTime] = useState(0);
	const lastCallTimeRef = useRef(0);
	const intervalRef = useRef<number | null>(null); // setInterval ID 저장
	const wsRef = useRef<WebSocket | null>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalUserDetailInfo, setModalUserDetailInfo] = useState<{
		userId: number;
		nickname: string;
		phoneNumber: string;
		latitude: number;
		longitude: number;
	} | null>(null);

	const emergencySocketRef = useRef<WebSocket | null>(null);

	const isDeaf = userInfo?.user_type === '농인';

	useEffect(() => {
		isMicActiveRef.current = isMicActive;
	}, [isMicActive]);

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

	useEffect(() => {
		if (isDeaf) return;

		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/video/${params.code}?token=${token}`,
		);
		wsRef.current = ws;

		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'motions') {
					const motions = data.data;
					if (Array.isArray(motions)) {
						const motionIndices = motions.map((m: any) => m.index);
						const unity = (window as any).unityInstance;
						console.log('👐 수신된 수어 인덱스 배열:', motionIndices);

						if (unity) {
							unity.SendMessage(
								'WebAvatarReceiverEmergency',
								'ReceiveAvatarName',
								type,
							);
							unity.SendMessage(
								'AnimationQueueWithPlayable', // Unity 안의 GameObject 이름
								'EnqueueAnimationsFromJson', // 함수 이름
								JSON.stringify(motionIndices),
							);
						} else {
							console.warn('⚠️ Unity 인스턴스가 아직 준비되지 않았습니다.');
						}
					}
				}
			} catch (error) {
				console.error('WebSocket 메시지 처리 중 오류 발생:', error);
			}
		};

		return () => {
			ws.close();
		};
	}, []);

	useEffect(() => {
		if (isDeaf) return;

		if (!('webkitSpeechRecognition' in window)) {
			alert('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬을 사용하세요.');
			return;
		}

		const recognitionInstance = new (window as any).webkitSpeechRecognition();
		recognitionInstance.continuous = true;
		recognitionInstance.interimResults = true;
		recognitionInstance.lang = 'ko-KR';

		recognitionInstance.onstart = () => {
			setIsListening(true);
			console.log('음성 인식 시작됨');
		};

		recognitionInstance.onresult = (event: any) => {
			let newFinalTranscript = '';
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					newFinalTranscript = event.results[i][0].transcript.trim();
				}
			}

			if (newFinalTranscript) {
				console.log('📤 음성 → 텍스트:', newFinalTranscript);
				wsRef.current?.send(
					JSON.stringify({
						type: 'text',
						avatar: type,
						data: { text: newFinalTranscript },
					}),
				);
			}
		};

		recognitionInstance.onerror = (event: any) => {
			console.error('음성 인식 오류:', event.error);
		};

		recognitionInstance.onend = () => {
			console.log('음성 인식 종료됨');
			setIsListening(false);

			if (isMicActiveRef.current) {
				console.log('음성 인식 재시작 시도');
				recognitionInstance.start();
			}
		};

		setRecognition(recognitionInstance);
	}, [isDeaf]);

	useEffect(() => {
		if (!recognition) return;

		if (isMicActive && !isListening) {
			recognition.start();
		} else if (!isMicActive && isListening) {
			recognition.stop();
		}
	}, [recognition, isMicActive]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const unity = (window as any).unityInstance;

			if (unity) {
				console.log('🚀 아바타 전송:', type);
				unity.SendMessage(
					'WebAvatarReceiverEmergency',
					'ReceiveAvatarName',
					type,
				);
			} else {
				console.warn('😢 unityInstance 아직 없음');
			}
		}, 8000);

		return () => clearTimeout(timer);
	}, [userInfo?.emergency_type]);

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
		recognition.stop();
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

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import Lottie from 'lottie-react';
import MicBlockIcon from 'src/assets/block-mic.svg';
import videoLoading from 'src/assets/video-loading.json';
import useUserInfo from '../../../../../hooks/useUserInfo';
import OpponentInformation from '../OpponentInformation';
import styles from './Video.module.scss';
import useTokenState from '@/hooks/useTokenState';
import { useStartTimeStore } from '@/utils/zustand/callTime';

interface VideoProps {
	peerStatus: boolean;
	setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>;
	code: string;
	isCameraActive: boolean;
	isMicActive: boolean;
	onLeave?: () => void;
	callType: 'general' | 'emergency';
}

export default function Video(props: VideoProps) {
	const {
		peerStatus,
		setPeerStatus,
		code,
		isCameraActive,
		isMicActive,
		onLeave,
		callType,
	} = props;
	const { data: userInfo } = useUserInfo();
	const { startTime, setStartTime } = useStartTimeStore();

	const [predictionWord, setPredictionWord] = useState<string>('');
	const [predictionSen, setPredictionSen] = useState<string>('');

	const [isPeerCameraActive, setIsPeerCameraActive] = useState(true);
	const [isPeerMicActive, setIsPeerMicActive] = useState(true);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const cameraRef = useRef<Camera | null>(null);
	const holisticRef = useRef<Holistic | null>(null);
	const [peerNickname, setPeerNickname] = useState<string>('상대방');
	const [peerType, setPeerType] = useState<string>('일반인');
	const landmarkBufferRef = useRef<any[][]>([]);

	const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
	const isRemoteDescSetRef = useRef(false);

	useEffect(() => {
		if (!code) return;

		const token = useTokenState();

		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}?token=${token}`,
		);
		wsRef.current = ws;

		ws.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log('WebSocket 메시지 수신:', data);

				if (data.type === 'camera_state' && data.client_id === 'peer') {
					console.log('상대방 카메라 상태 변경:', data.data.isCameraActive);
					setIsPeerCameraActive(data.data.isCameraActive);

					if (remoteVideoRef.current && peerConnectionRef.current) {
						const receiverStreams = peerConnectionRef.current
							.getReceivers()
							.map((r) => r.track)
							.filter(Boolean);

						const newStream = new MediaStream();
						receiverStreams.forEach((track) => newStream.addTrack(track));
						remoteVideoRef.current.srcObject = newStream;
						remoteVideoRef.current.play();
					}
				}

				if (data.type === 'mic_state' && data.client_id === 'peer') {
					console.log('상대방 음소거 상태 변경', data.data.isMicActive);
					setIsPeerMicActive(data.data.isMicActive);
				}

				if (data.type === 'offer') {
					await peerConnectionRef.current?.setRemoteDescription(
						new RTCSessionDescription(data.data),
					);
					isRemoteDescSetRef.current = true;

					const answer = await peerConnectionRef.current?.createAnswer();
					if (answer) {
						await peerConnectionRef.current?.setLocalDescription(answer);
						ws.send(JSON.stringify({ type: 'answer', data: answer }));
					}

					while (candidateQueueRef.current.length > 0) {
						const candidate = candidateQueueRef.current.shift();
						if (candidate) {
							await peerConnectionRef.current?.addIceCandidate(
								new RTCIceCandidate(candidate),
							);
						}
					}
					setPeerStatus(true);
				}
				if (data.type === 'answer') {
					await peerConnectionRef.current?.setRemoteDescription(
						new RTCSessionDescription(data.data),
					);
					setPeerStatus(true);
					setTimeout(() => {
						if (
							remoteVideoRef.current &&
							!remoteVideoRef.current.srcObject &&
							peerConnectionRef.current
						) {
							const remoteStream = new MediaStream();
							peerConnectionRef.current.getReceivers().forEach((receiver) => {
								if (
									receiver.track.kind === 'video' ||
									receiver.track.kind === 'audio'
								) {
									remoteStream.addTrack(receiver.track);
								}
							});
							remoteVideoRef.current.srcObject = remoteStream;
							remoteVideoRef.current.play();
						}
					}, 1000);
				}
				if (data.type === 'candidate') {
					const candidate = new RTCIceCandidate(data.data);
					if (!isRemoteDescSetRef.current) {
						console.log('⏳ remoteDescription 아직 없음 → candidate 큐에 저장');
						candidateQueueRef.current.push(data.data); // ✅ 큐잉
					} else {
						try {
							await peerConnectionRef.current?.addIceCandidate(candidate);
						} catch (e) {
							console.error('❌ addIceCandidate 오류:', e);
						}
					}
				}
				if (data.type === 'leave') {
					console.log('상대방이 나갔습니다.');

					if (remoteVideoRef.current) {
						remoteVideoRef.current.srcObject = null;
					}
					peerConnectionRef.current?.close();
					peerConnectionRef.current = null;

					isRemoteDescSetRef.current = false;
					candidateQueueRef.current = [];

					setPeerStatus(false);
					onLeave?.();
				}
				if (data.type === 'startCall') {
					console.log('🟢 startCall 수신', data.client_id);

					if (data.client_id === 'self') {
						console.log('🟢 나는 initiator, offer 생성 시작');
						startStreaming();
					}
					if (data.client_id === 'peer') {
						setPeerNickname(data.nickname);
						setPeerType(data.user_type);
						setStartTime(data.started_at);
					}
				}
				if (data.type === 'text' && data.client_id === 'peer') {
					if (data.result) {
						console.log('단어: ', data.result);
						setPredictionWord(data.result);
						setPeerStatus(true);
					}
				}
				if (data.type === 'sentence' && data.client_id === 'peer') {
					if (data.result) {
						console.log('문장: ', data.result);
						setPredictionSen(data.result);
						setPeerStatus(true);
					}
				}
			} catch (error) {
				console.error('WebSocket 메시지 처리 중 오류 발생:', error);
			}
		};

		ws.onopen = () => {
			console.log(`Connected to room ${code}`);
		};

		ws.onclose = () => {
			console.log('WebSocket 연결 종료');
			setPeerStatus(false);
		};

		ws.onerror = (error) => {
			console.error('WebSocket 오류 발생:', error);
		};

		return () => {
			console.log('Video 컴포넌트 언마운트 - 정리 로직 실행');

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}

			if (cameraRef.current) {
				cameraRef.current.stop();
				cameraRef.current = null;
			}

			if (remoteVideoRef.current) {
				remoteVideoRef.current.pause();
				remoteVideoRef.current.srcObject = null;
				remoteVideoRef.current.load();
			}

			if (localVideoRef.current) {
				localVideoRef.current.pause();
				localVideoRef.current.srcObject = null;
				localVideoRef.current.load();
			}

			wsRef.current?.close();
			wsRef.current = null;

			peerConnectionRef.current?.close();
			peerConnectionRef.current = null;

			setPeerStatus(false);
		};
	}, [code]);

	const startStreaming = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			streamRef.current = stream;
			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}

			const peerConnection = new RTCPeerConnection({
				iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
			});
			peerConnectionRef.current = peerConnection;

			peerConnection.onconnectionstatechange = () => {
				if (peerConnection.connectionState === 'connected') {
					console.log('✅ peer connected → 수신 트랙 수동 설정 시도');
					if (
						remoteVideoRef.current &&
						!remoteVideoRef.current.srcObject &&
						peerConnection
					) {
						const remoteStream = new MediaStream();
						peerConnection.getReceivers().forEach((receiver) => {
							if (
								receiver.track.kind === 'video' ||
								receiver.track.kind === 'audio'
							) {
								remoteStream.addTrack(receiver.track);
							}
						});
						remoteVideoRef.current.srcObject = remoteStream;
						remoteVideoRef.current.play();
					}
				}
			};

			stream
				.getTracks()
				.forEach((track) => peerConnection.addTrack(track, stream));

			peerConnection.ontrack = (event) => {
				const remoteVideo = remoteVideoRef.current;
				if (remoteVideo) {
					let remoteStream = remoteVideo.srcObject as MediaStream | null;
					if (!remoteStream) {
						remoteStream = new MediaStream();
						remoteVideo.srcObject = remoteStream;
					}

					if (!remoteStream.getTracks().includes(event.track)) {
						remoteStream.addTrack(event.track);
					}

					remoteVideo.play();
				}
			};

			peerConnection.onicecandidate = (event) => {
				if (event.candidate) {
					wsRef.current?.send(
						JSON.stringify({ type: 'candidate', data: event.candidate }),
					);
				}
			};

			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);

			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: 'offer', data: offer }));
			}

			const holistic = new Holistic({
				locateFile: (file) =>
					`https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
			});
			holisticRef.current = holistic;

			holistic.setOptions({
				modelComplexity: 1,
				smoothLandmarks: true,
				minDetectionConfidence: 0.5,
				minTrackingConfidence: 0.5,
			});

			const camera = new Camera(localVideoRef.current!, {
				onFrame: async () => {
					await holistic.send({ image: localVideoRef.current! });
				},
				width: 640,
				height: 480,
			});
			cameraRef.current = camera;
			camera.start();

			holistic.onResults((results) => {
				const allLandmarks = [
					...(results.poseLandmarks ?? []),
					...(results.leftHandLandmarks ?? []),
					...(results.rightHandLandmarks ?? []),
				];

				const frame = [];

				for (let i = 0; i < 75; i++) {
					const lm = allLandmarks[i];
					if (lm) {
						frame.push({
							x: parseFloat(lm.x.toFixed(4)),
							y: parseFloat(lm.y.toFixed(4)),
							z: parseFloat(lm.z.toFixed(4)),
						});
					} else {
						frame.push({ x: 0.0, y: 0.0, z: 0.0 });
					}
				}

				const buffer = landmarkBufferRef.current;
				buffer.push(frame);

				if (buffer.length >= 30) {
					const payload = {
						type: 'land_mark',
						data: {
							pose: buffer.slice(0, 30),
						},
					};
					wsRef.current?.send(JSON.stringify(payload));

					landmarkBufferRef.current = buffer.slice(5);
				}
			});
		} catch (err) {
			console.error('웹캠 접근 에러:', err);
		}
	};

	useEffect(() => {
		const sendCameraState = () => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				wsRef.current.send(
					JSON.stringify({
						type: 'camera_state',
						data: { isCameraActive },
					}),
				);
			}
		};

		const setupCamera = async () => {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			streamRef.current = stream;

			if (localVideoRef.current) {
				localVideoRef.current.srcObject = stream;
			}

			const videoTrack = stream.getVideoTracks()[0];
			const sender = peerConnectionRef.current
				?.getSenders()
				.find((s) => s.track?.kind === 'video');
			if (sender && videoTrack) {
				sender.replaceTrack(videoTrack);
			}

			const holistic = new Holistic({
				locateFile: (file) =>
					`https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
			});

			holistic.setOptions({
				modelComplexity: 1,
				smoothLandmarks: true,
				minDetectionConfidence: 0.5,
				minTrackingConfidence: 0.5,
			});
			holisticRef.current = holistic;

			const camera = new Camera(localVideoRef.current!, {
				onFrame: async () => {
					await holistic.send({ image: localVideoRef.current! });
				},
				width: 640,
				height: 480,
			});

			cameraRef.current = camera;
			camera.start();
		};

		const stopCamera = () => {
			console.log('🛑 카메라 stop() 호출');

			cameraRef.current?.stop();
			cameraRef.current = null;

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => {
					track.stop();
				});
				streamRef.current = null;
			}

			if (localVideoRef.current) {
				localVideoRef.current.pause();
				localVideoRef.current.srcObject = null;
				localVideoRef.current.load();
			}
		};

		if (isCameraActive) {
			setupCamera();
		} else {
			stopCamera();
		}

		sendCameraState();

		return () => {
			stopCamera(); // unmount 시에도 정리
		};
	}, [isCameraActive]);

	useEffect(() => {
		if (streamRef.current) {
			streamRef.current.getAudioTracks().forEach((track) => {
				track.enabled = isMicActive;
			});
		}

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(
				JSON.stringify({
					type: 'mic_state',
					data: { isMicActive },
				}),
			);
		}
	}, [isMicActive]);

	return (
		<div>
			<div
				className={cn({
					[styles['video-container']]: true,
					[styles['video-container--not-connected']]:
						!peerStatus && callType === 'general',
					[styles['video-container--emergency']]: callType === 'emergency',
				})}
			>
				<div
					className={cn({
						[styles['video-wrapper']]: true,
						[styles['video-wrapper__main']]: peerStatus,
						[styles['video-wrapper__hidden']]:
							callType === 'general' && !peerStatus,
						[styles['video-wrapper__sub']]:
							callType === 'emergency' && !peerStatus,
					})}
				>
					{peerStatus ? (
						<video
							className={cn({
								[styles['video-container__main-video']]: peerStatus,
								[styles['video-container--hidden']]:
									callType === 'general' && !peerStatus,
							})}
							ref={remoteVideoRef}
							autoPlay
							playsInline
						/>
					) : (
						<Lottie
							animationData={videoLoading}
							style={{ width: '40px', height: '40px' }}
						/>
					)}
					{peerStatus && !isPeerCameraActive && (
						<div className={styles['video-wrapper__overlay']}>
							<span>{peerNickname}</span>
						</div>
					)}
					{peerStatus && !isPeerMicActive && (
						<div className={styles['video-wrapper__mic-off-overlay']}>
							<MicBlockIcon />
						</div>
					)}
				</div>
				<div
					className={cn({
						[styles['video-wrapper']]: true,
						[styles['video-wrapper__sub']]: peerStatus,
						[styles['video-wrapper__main']]: !peerStatus,
					})}
				>
					<video
						className={cn({
							[styles['video-container__sub-video']]: peerStatus,
							[styles['video-container__main-video']]: !peerStatus,
						})}
						ref={localVideoRef}
						autoPlay
						playsInline
					/>
					{!isCameraActive && (
						<div className={styles['video-wrapper__overlay']}>
							<span>{userInfo!.nickname}</span>
						</div>
					)}
					{!isMicActive && (
						<div className={styles['video-wrapper__mic-off-overlay']}>
							<MicBlockIcon />
						</div>
					)}
				</div>
				<OpponentInformation
					callType={callType}
					peerStatus={peerStatus}
					peerNickname={peerNickname}
					peerType={peerType}
					startTime={startTime}
				/>
			</div>
			{<p>현재 단어: {predictionWord}</p>}
			{<p>현재 문장: {predictionSen}</p>}
		</div>
	);
}

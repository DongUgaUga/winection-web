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

interface VideoProps {
	peerStatus: boolean;
	setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>;
	code: string;
	isCameraActive: boolean;
	isMicActive: boolean;
	callType: 'general' | 'emergency';
	callStartTime: string | null;
}

export default function Video(props: VideoProps) {
	const {
		peerStatus,
		setPeerStatus,
		code,
		isCameraActive,
		isMicActive,
		callType,
		callStartTime,
	} = props;
	const { data: userInfo } = useUserInfo();
	const [prediction, setPrediction] = useState<string>('');

	const [isPeerCameraActive, setIsPeerCameraActive] = useState(true);
	const [isPeerMicActive, setIsPeerMicActive] = useState(true);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const cameraRef = useRef<Camera | null>(null);
	const holisticRef = useRef<Holistic | null>(null);

	useEffect(() => {
		if (!code) return;

		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}`,
		);
		wsRef.current = ws;

		ws.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log('Received message:', data);

				// 📌 카메라 상태 메시지 처리
				if (data.type === 'camera_state' && data.client_id === 'peer') {
					console.log('상대방 카메라 상태 변경:', data.data.isCameraActive);
					setIsPeerCameraActive(data.data.isCameraActive);

					// 강제 재할당으로 멈춘 영상 리렌더링
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
					const answer = await peerConnectionRef.current?.createAnswer();
					if (answer) {
						await peerConnectionRef.current?.setLocalDescription(answer);
						ws.send(JSON.stringify({ type: 'answer', data: answer }));
					}
					setPeerStatus(true);
				}
				if (data.type === 'answer') {
					await peerConnectionRef.current?.setRemoteDescription(
						new RTCSessionDescription(data.data),
					);
					setPeerStatus(true);
				}
				if (data.type === 'candidate') {
					await peerConnectionRef.current?.addIceCandidate(
						new RTCIceCandidate(data.data),
					);
				}
				if (data.type === 'leave') {
					console.log('상대방이 나갔습니다.');

					if (remoteVideoRef.current) {
						remoteVideoRef.current.srcObject = null;
					}
					peerConnectionRef.current?.close();
					peerConnectionRef.current = null;

					setPeerStatus(false);
				}
				if (data.client_id === 'peer') {
					if (data.result) {
						console.log('Received result', data.result);
						setPrediction(data.result);
						setPeerStatus(true);
					}
				}
			} catch (error) {
				console.error('WebSocket 메시지 처리 중 오류 발생:', error);
			}
		};

		ws.onopen = () => {
			console.log(`Connected to room ${code}`);
			startStreaming();
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

			stream
				.getTracks()
				.forEach((track) => peerConnection.addTrack(track, stream));

			peerConnection.ontrack = (event) => {
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = event.streams[0];
				}
			};

			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			wsRef.current?.send(JSON.stringify({ type: 'offer', data: offer }));

			peerConnection.onicecandidate = (event) => {
				if (event.candidate) {
					wsRef.current?.send(
						JSON.stringify({ type: 'candidate', data: event.candidate }),
					);
				}
			};

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
				const landMark = {
					pose:
						results.poseLandmarks?.map((lm) => ({
							x: parseFloat(lm.x.toFixed(2)),
							y: parseFloat(lm.y.toFixed(2)),
							z: parseFloat(lm.z.toFixed(2)),
						})) || [],
					left_hand:
						results.leftHandLandmarks?.map((lm) => ({
							x: parseFloat(lm.x.toFixed(2)),
							y: parseFloat(lm.y.toFixed(2)),
							z: parseFloat(lm.z.toFixed(2)),
						})) || [],
					right_hand:
						results.rightHandLandmarks?.map((lm) => ({
							x: parseFloat(lm.x.toFixed(2)),
							y: parseFloat(lm.y.toFixed(2)),
							z: parseFloat(lm.z.toFixed(2)),
						})) || [],
				};

				wsRef.current?.send(
					JSON.stringify({
						type: 'land_mark',
						data: { land_mark: landMark },
					}),
				);
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

			// ✅ 새 비디오 트랙으로 기존 sender 교체
			const videoTrack = stream.getVideoTracks()[0];
			const sender = peerConnectionRef.current
				?.getSenders()
				.find((s) => s.track?.kind === 'video');
			if (sender && videoTrack) {
				sender.replaceTrack(videoTrack);
			}

			// MediaPipe Camera 연결
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
							<span>동동우동이</span>
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
					callStartTime={callStartTime}
				/>
			</div>
			{<p>예측된 결과: {prediction}</p>}
		</div>
	);
}

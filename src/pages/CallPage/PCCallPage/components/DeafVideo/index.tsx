import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import { Camera } from '@mediapipe/camera_utils';
import { Holistic } from '@mediapipe/holistic';
import Lottie from 'lottie-react';
import MicBlockIcon from 'src/assets/block-mic.svg';
import videoLoading from 'src/assets/video-loading.json';
import useUserInfo from '../../../../../hooks/useUserInfo';
import OpponentInformation from '../OpponentInformation';
import styles from './DeafVideo.module.scss';
import useTokenState from '@/hooks/useTokenState';
import { useStartTimeStore } from '@/utils/zustand/callTime';

interface DeafVideoProps {
	peerStatus: boolean;
	setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>;
	code: string;
	isCameraActive: boolean;
	isMicActive: boolean;
	isUnityReady: boolean;
	voice?: string;
	onLeave?: () => void;
	callType: 'general' | 'emergency';
}

export default function DeafVideo(props: DeafVideoProps) {
	const {
		peerStatus,
		setPeerStatus,
		code,
		isCameraActive,
		isMicActive,
		isUnityReady,
		voice,
		onLeave,
		callType,
	} = props;
	const voiceRef = useRef(voice);
	useEffect(() => {
		voiceRef.current = voice;
	}, [voice]);
	const { data: userInfo } = useUserInfo();
	const { startTime, setStartTime } = useStartTimeStore();

	const [isPeerCameraActive, setIsPeerCameraActive] = useState(true);
	const [isPeerMicActive, setIsPeerMicActive] = useState(true);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const unityCanvasRef = useRef<HTMLCanvasElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const cameraRef = useRef<Camera | null>(null);
	const holisticRef = useRef<Holistic | null>(null);
	const [peerNickname, setPeerNickname] = useState<string>('');
	const [peerType, setPeerType] = useState<string>('');
	const landmarkBufferRef = useRef<any[][]>([]);

	const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
	const isRemoteDescSetRef = useRef(false);

	const [saidSentence, setSaidSentence] = useState('');

	useEffect(() => {
		if (!code) return;

		const token = useTokenState();

		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/video/${code}?token=${token}`,
		);
		wsRef.current = ws;

		ws.onmessage = async (event) => {
			try {
				const data = JSON.parse(event.data);
				console.log('WebSocket 메시지 수신:', data);

				if (data.type === 'camera_state' && data.client_id === 'peer') {
					console.log('상대방 카메라 상태 변경:', data.data.isCameraActive);
					setIsPeerCameraActive(data.data.isCameraActive);
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
				if (data.type === 'motions') {
					const motions = data.data;
					if (Array.isArray(motions)) {
						const motionIndices = motions.map((m: any) => m.index);
						const unity = (window as any).unityInstance;
						setSaidSentence(data.sentence);
						console.log('👐 수신된 수어 인덱스 배열:', motionIndices);

						if (unity) {
							unity.SendMessage(
								`WebAvatarReceiverMerged`,
								'ReceiveAvatarName',
								data.avatar,
							);
							unity.SendMessage(
								'AnimationQueueWithPlayable',
								'EnqueueAnimationsFromJson',
								JSON.stringify(motionIndices),
							);
						} else {
							console.warn('⚠️ Unity 인스턴스가 아직 준비되지 않았습니다.');
						}
					}
				}
				if (data.type === 'leave') {
					console.log('상대방이 나갔습니다.');

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
				}
			};

			stream
				.getTracks()
				.forEach((track) => peerConnection.addTrack(track, stream));

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
						voice: voiceRef.current,
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

	useEffect(() => {
		const script = document.createElement('script');
		script.src = `/unity-build/Build/unity-build.loader.js`;

		script.onload = () => {
			let retryCount = 0;
			const maxRetries = 10;
			const retryDelay = 500;

			const tryCreateUnityInstance = () => {
				const canvas = document.querySelector('#unity-canvas');
				if (!canvas) {
					if (retryCount < maxRetries) {
						retryCount++;
						console.warn(
							`⚠️ unity-canvas를 찾을 수 없습니다. 재시도 (${retryCount})`,
						);
						setTimeout(tryCreateUnityInstance, retryDelay);
					} else {
						console.error('❌ unity-canvas를 찾을 수 없습니다. 재시도 실패');
					}
					return;
				}

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				createUnityInstance(canvas, {
					dataUrl: `/unity-build/Build/unity-build.data`,
					frameworkUrl: `/unity-build/Build/unity-build.framework.js`,
					codeUrl: `/unity-build/Build/unity-build.wasm`,
				})
					.then((unityInstance: any) => {
						console.log('✅ Unity 인스턴스 로드 완료', unityInstance);
						(window as any).unityInstance = unityInstance;
						unityInstance.SendMessage('ReceiverObject', 'SetRoomId', code);
					})
					.catch((err: any) => {
						console.error('❌ Unity 인스턴스 로드 실패', err);
					});
			};

			setTimeout(tryCreateUnityInstance, 100);
		};

		document.body.appendChild(script);
	}, [peerStatus]);

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
						<canvas
							id="unity-canvas"
							ref={unityCanvasRef}
							style={{ display: isUnityReady ? 'block' : 'none' }}
							className={cn({
								[styles['video-container__main-video']]: peerStatus,
								[styles['video-container__main-video--canvas']]: peerStatus,
								[styles['video-container--hidden']]:
									callType === 'general' && !peerStatus,
							})}
							tabIndex={-1}
						></canvas>
					) : (
						<Lottie
							animationData={videoLoading}
							className={styles['loading-spinner']}
						/>
					)}
					{!isUnityReady && (
						<div className={styles['video-loading-overlay']}>
							<Lottie
								animationData={videoLoading}
								className={styles['loading-spinner']}
							/>
							<div
								className={cn({
									[styles['avatar-loading-text']]: true,
									[styles['avatar-loading-text__sub']]: peerStatus,
								})}
							>
								아바타를 불러오는 중입니다
								<span className={styles['dot']}>.</span>
								<span className={styles['dot']}>.</span>
								<span className={styles['dot']}>.</span>
							</div>
						</div>
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
			<p className={styles.sentence}>{saidSentence}</p>
		</div>
	);
}

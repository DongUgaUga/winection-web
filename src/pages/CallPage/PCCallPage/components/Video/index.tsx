import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
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
	avatar: string;
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
		avatar,
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

	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const unityCanvasRef = useRef<HTMLCanvasElement>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const [peerNickname, setPeerNickname] = useState<string>('');
	const [peerType, setPeerType] = useState<string>('');

	const candidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
	const isRemoteDescSetRef = useRef(false);

	const [isCanvasVisible, setIsCanvasVisible] = useState(false);

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
				if (data.type === 'motions') {
					const motions = data.data; // ex: [{ word: '안녕하세요', index: 12 }, ...]

					if (Array.isArray(motions)) {
						const motionIndices = motions.map((m) => m.index);

						console.log('👐 수신된 수어 인덱스 배열:', motionIndices);

						// Unity로 수어 인덱스 배열 전송
						if ((window as any).unityInstance) {
							(window as any).unityInstance.SendMessage(
								userInfo?.user_type === '청인'
									? 'WebAvatarReceiver'
									: 'WebAvatarReceiverEmergency',
								'ReceiveAvatarName',
								avatar,
							);
							(window as any).unityInstance.SendMessage(
								'AnimatorQueue', // <- Unity에서 해당 오브젝트 이름으로 받을 것
								'EnqueueAnimationsFromJson', // <- Unity에서 실행할 메서드
								JSON.stringify(motionIndices), // 문자열 배열로 보내야 Unity에서 파싱 가능
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
			if (remoteVideoRef.current) {
				remoteVideoRef.current.pause();
				remoteVideoRef.current.srcObject = null;
				remoteVideoRef.current.load();
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
		} catch (err) {
			console.error('Failed to start streaming:', err);
		}
	};

	// Removed camera and mic state tracking effects

	useEffect(() => {
		// ✅ Unity 인스턴스 로드
		const script = document.createElement('script');
		script.src = '/unity-build/Build/unity-build.loader.js';
		script.onload = () => {
			setTimeout(() => {
				const canvas = document.querySelector('#unity-canvas');
				if (!canvas) {
					console.error('❌ unity-canvas를 찾을 수 없습니다.');
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				createUnityInstance(canvas, {
					dataUrl: '/unity-build/Build/unity-build.data',
					frameworkUrl: '/unity-build/Build/unity-build.framework.js',
					codeUrl: '/unity-build/Build/unity-build.wasm',
				})
					.then((unityInstance: any) => {
						console.log('✅ Unity 인스턴스 로드 완료', unityInstance);
						(window as any).unityInstance = unityInstance;
						unityInstance.SendMessage('ReceiverObject', 'SetRoomId', code);
					}, 5000)
					.catch((err: any) => {
						console.error('❌ Unity 인스턴스 로드 실패', err);
					});
			}, 100);
		};
		document.body.appendChild(script);
	}, []);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsCanvasVisible(true);
		}, 6000);

		return () => clearTimeout(timer);
	}, []);

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
					<canvas
						id="unity-canvas"
						ref={unityCanvasRef}
						style={{ display: isCanvasVisible ? 'block' : 'none' }}
						className={cn({
							[styles['video-container__sub-video']]: peerStatus,
							[styles['video-container__sub-video--canvas']]: peerStatus,
							[styles['video-container__main-video']]: !peerStatus,
							[styles['video-container__main-video--canvas']]: !peerStatus,
						})}
						tabIndex={-1}
					/>
					{!isCanvasVisible && (
						<div className={styles['video-loading-overlay']}>
							<Lottie
								animationData={videoLoading}
								style={{ width: 40, height: 40 }}
							/>
						</div>
					)}
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

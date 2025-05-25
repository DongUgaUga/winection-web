import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import Lottie from 'lottie-react';
import { useNavigate, useParams } from 'react-router-dom';
import avatar1 from 'src/assets/avatar/1_김성준.png';
import avatar2 from 'src/assets/avatar/2_하유리.png';
import avatar3 from 'src/assets/avatar/3_최필랍.png';
import avatar4 from 'src/assets/avatar/4_이서현.png';
import CameraBlockIcon from 'src/assets/block-camera.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CameraIcon from 'src/assets/camera.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import MicIcon from 'src/assets/mic.svg';
import videoLoading from 'src/assets/video-loading.json';
import Toast from '../../../../components/Toast';
import useUserInfo from '../../../../hooks/useUserInfo';
import { formatTime } from '../../../../utils/functions/formatTime';
import DeafVideo from '../components/DeafVideo';
import Video from '../components/Video';
import styles from './PCGeneralCallPage.module.scss';
import useTokenState from '@/hooks/useTokenState';
import { useAvatarStore } from '@/utils/zustand/avatar';

const VOICES = ['성인 남자', '성인 여자', '어린 남자', '어린 여자'];
const AVATARS = [
	{
		src: avatar1,
		name: '김성준',
	},
	{
		src: avatar2,
		name: '하유리',
	},
	{
		src: avatar3,
		name: '최필랍',
	},
	{
		src: avatar4,
		name: '이서현',
	},
];

const StyleSelect = () => {
	const { data: userInfo } = useUserInfo();
	const { avatar, setAvatar } = useAvatarStore();

	const [voice, setVoice] = useState(VOICES[0]);
	const [act, setAct] = useState(1); // 삭제 예정

	useEffect(() => {
		setAvatar(AVATARS[0].name);
	}, []);

	useEffect(() => {
		if ((window as any).unityInstance && avatar) {
			console.log('[React] 보내는 아바타:', avatar);
			(window as any).unityInstance.SendMessage(
				'WebAvatarReceiver',
				'ReceiveAvatarName',
				avatar,
			);
		}
	}, [avatar]);

	// 삭제 예정
	useEffect(() => {
		const unity = (window as any).unityInstance;
		if (!unity) return;

		unity.SendMessage('WebAvatarReceiver', 'ReceiveAvatarName', avatar);
		unity.SendMessage(
			'WebAvatarReceiver',
			'ReceiveIndexJson',
			JSON.stringify([1, 3, 4, 21]),
		);
	}, [act]);
	const handleClick = () => {
		setAct((state) => state + 1);
	};

	return (
		<>
			{userInfo!.user_type === '농인' ? (
				<div className={styles.style}>
					<div className={styles.style__select}>목소리 선택</div>
					<div className={styles.voices}>
						{VOICES.map((v) => (
							<button
								key={v}
								className={cn({
									[styles['voices__voice']]: true,
									[styles['voices__voice--selected']]: voice === v,
								})}
								onClick={() => setVoice(v)}
							>
								{v}
							</button>
						))}
					</div>
				</div>
			) : (
				<div className={styles.style}>
					<div className={styles.style__select}>아바타 선택</div>
					<button onClick={handleClick}>클릭클릭</button> {/* 삭제 예정 */}
					<div className={styles.avatars}>
						{AVATARS.map((ava) => (
							<button
								key={ava.name}
								className={styles.avatars__avatar}
								onClick={() => setAvatar(ava.name)}
							>
								<img
									src={ava.src}
									alt="avatar"
									className={styles['avatars__avatar--image']}
								/>
								<div
									className={cn({
										[styles['avatars__avatar--name']]: true,
										[styles['avatars__avatar--name--selected']]:
											avatar === ava.name,
									})}
								>
									{ava.name}
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</>
	);
};

// 농인과 청인만 사용하는 페이지
export default function PCGeneralCallPage() {
	const params = useParams();
	const navigate = useNavigate();
	const { data: userInfo } = useUserInfo();
	const token = useTokenState();

	const [copyToast, setCopyToast] = useState(false);

	const [isMicActive, setIsMicActive] = useState(true);
	const [isCameraActive, setIsCameraActive] = useState(true);

	const [peerStatus, setPeerStatus] = useState(false);
	const [callTime, setCallTime] = useState(0);

	const [recognition, setRecognition] = useState<any>(null);
	const [isListening, setIsListening] = useState(false);

	const lastCallTimeRef = useRef(0);
	const intervalRef = useRef<number | null>(null); // setInterval ID 저장

	const wsRef = useRef<WebSocket | null>(null);

	const copyRoomCode = () => {
		navigator.clipboard
			.writeText(params.code!)
			.then(() => {
				setCopyToast(true);
			})
			.catch(() => {
				alert('코드 복사에 실패했습니다.');
			});
	};

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

	const isDeaf = userInfo?.user_type === '농인';

	const updateCallTime = useCallback(() => {
		setCallTime((prev) => {
			const newTime = prev + 1;
			lastCallTimeRef.current = newTime;
			return newTime;
		});
	}, []);

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
		if (isDeaf) return;

		const ws = new WebSocket(
			`wss://${import.meta.env.VITE_SERVER_URL}/ws/video/${params.code}?token=${token}`,
		);
		wsRef.current = ws;

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
					JSON.stringify({ type: 'text', data: { text: newFinalTranscript } }),
				);
			}
		};

		recognitionInstance.onerror = (event: any) => {
			console.error('음성 인식 오류:', event.error);
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

	return (
		<div className={styles.container}>
			<div
				className={cn({
					[styles.code]: true,
					[styles['code__success-connect']]: peerStatus,
				})}
			>
				<input disabled value={params.code} className={styles.code__input} />
				<button className={styles.code__button} onClick={copyRoomCode}>
					Copy
				</button>
				{copyToast && (
					<div className={styles.toast}>
						<Toast setToast={setCopyToast} text="copied!" />
					</div>
				)}
			</div>
			<div
				className={cn({
					[styles.content]: true,
					[styles['content__success-connect']]: peerStatus,
				})}
			>
				<StyleSelect />
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
								callType="general"
							/>
						) : (
							<Video
								peerStatus={peerStatus}
								setPeerStatus={setPeerStatus}
								code={params.code!}
								isCameraActive={isCameraActive}
								isMicActive={isMicActive}
								callType="general"
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

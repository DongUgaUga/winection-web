import { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import Lottie from 'lottie-react';
import { useNavigate, useParams } from 'react-router-dom';
import avatar1 from 'src/assets/avatar1.png';
import avatar2 from 'src/assets/avatar2.png';
import avatar3 from 'src/assets/avatar3.png';
import avatar4 from 'src/assets/avatar4.png';
import CameraBlockIcon from 'src/assets/block-camera.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CameraIcon from 'src/assets/camera.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import MicIcon from 'src/assets/mic.svg';
import videoLoading from 'src/assets/video-loading.json';
import Toast from '../../../../components/Toast';
import useUserInfo from '../../../../hooks/useUserInfo';
import {
	formatTime,
	formatKoreanDate,
} from '../../../../utils/functions/formatTime';
import Video from '../components/Video';
import styles from './PCGeneralCallPage.module.scss';

const VOICES = ['성인 남자', '성인 여자', '어린 남자', '어린 여자'];
const AVATARS = [
	{
		src: avatar1,
		name: '지민',
	},
	{
		src: avatar2,
		name: '시안',
	},
	{
		src: avatar3,
		name: '영현',
	},
	{
		src: avatar4,
		name: '유나',
	},
];

const StyleSelect = () => {
	const { data: userInfo } = useUserInfo();

	const [voice, setVoice] = useState(VOICES[0]);
	const [avatar, setAvatar] = useState(AVATARS[0].name);

	useEffect(() => {
		console.log(voice, avatar);
	}, []);

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
					<div className={styles.avatars}>
						{AVATARS.map((avatar) => (
							<button
								key={avatar.name}
								className={styles.avatars__avatar}
								onClick={() => setAvatar(avatar.name)}
							>
								<img
									src={avatar.src}
									alt="avatar"
									className={styles['avatars__avatar--image']}
								/>
								<div className={styles['avatars__avatar--name']}>
									{avatar.name}
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</>
	);
};

// 농인과 일반인만 사용하는 페이지
export default function PCGeneralCallPage() {
	const params = useParams();
	const navigate = useNavigate();

	const [copyToast, setCopyToast] = useState(false);

	const [isMicActive, setIsMicActive] = useState(true);
	const [isCameraActive, setIsCameraActive] = useState(true);

	const [peerStatus, setPeerStatus] = useState(false);
	const [callStartTime, setCallStartTime] = useState<Date | null>(null);
	const [callTime, setCallTime] = useState(0);
	const intervalRef = useRef<number | null>(null); // setInterval ID 저장

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
				callTime: formatTime(callTime, 'korean'),
				callStartTime: formatKoreanDate(callStartTime, 'korean'),
			},
		});
	};

	useEffect(() => {
		if (peerStatus && !callStartTime) {
			const now = new Date();
			setCallStartTime(now);
		}
	}, [peerStatus]);

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
								callType="general"
								callStartTime={formatKoreanDate(callStartTime, 'digit')}
							/>
						) : (
							<div>올바르지 않은 경로입니다.</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

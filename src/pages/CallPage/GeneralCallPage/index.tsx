import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import CameraIcon from 'src/assets/camera.svg';
import CameraBlcokIcon from 'src/assets/block-camera.svg';
import MicIcon from 'src/assets/mic.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import Video, { VideoHandle } from '../components/Video';
import LoadingSpinner from 'src/assets/loading-spinner.gif';
import styles from './GeneralCallPage.module.scss';
import Toast from '../../../components/Toast';

const VOICES = ['성인 남자', '성인 여자', '어린 남자', '어린 여자'];
const AVATARS = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/300px-Cat_November_2010-1a.jpg',
    name: '가가'
  },
  {
    src: 'https://i.namu.wiki/i/d1A_wD4kuLHmOOFqJdVlOXVt1TWA9NfNt_HA0CS0Y_N0zayUAX8olMuv7odG2FiDLDQZIRBqbPQwBSArXfEJlQ.webp',
    name: '나나'
  },
  {
    src: 'https://i.namu.wiki/i/yYbLn1JjcwHiJXSYSPRs46iaW2FytB5AQc1tBpoftJIN_ltHuHzLx09Glc27azN0Rk-SAqzQkB5QQxxDOVOu8w.webp',
    name: '다다'
  },
  {
    src: 'https://cdn.royalcanin-weshare-online.io/Y0DP7YsBRYZmsWpc3hP6/v3/puppy-walking-on-the-lawn-16-9',
    name: '라라'
  }
];

// 시간 포맷 (예: 00:02:15)
const formatTime = (seconds: number, type: 'digit' | 'korean') => {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  if (type === 'digit') {
    return `${h}:${m}:${s}`;  
  }

  if (type === 'korean') {
    if (h === '00' && m === '00') {
      return `${s}초`;
    }
    if (h === '00') {
      return `${m}분 ${s}초`;
    }
    return `${h} ${m}분 ${s}초`;
  }

  return '0';
};

const formatKoreanDate = (date: Date | null, type: 'digit' | 'korean'): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based month
  const day = String(date.getDate()).padStart(2, '0');

  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  if (type === 'digit') {
    return `${year}.${month}.${day}  ${hour}:${minute}`;
  }

  return `${year}년 ${month}월 ${day}일   ${hour}시 ${minute}분`;
};


function StyleSelect() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);

  const [voice, setVoice] = useState(VOICES[0]);
  const [avatar, setAvatar] = useState(AVATARS[0].name);

  useEffect(() => {
    console.log(voice, avatar);
  }, []);
  
  return (
    <>
      {userInfo.userClassification === '농인'
        ? (
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
                <div key={avatar.name} className={styles.avatars__avatar} onClick={() => setAvatar(avatar.name)}>
                  <img className={styles['avatars__avatar--image']} src={avatar.src} alt='아바타' />
                  <div className={styles['avatars__avatar--name']}>{avatar.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
    </>
  )
}

// 농인과 일반인만 사용하는 페이지
export default function GeneralCallPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [copyToast, setCopyToast] = useState(false);

  const [isMicActive, setIsMicActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);

  const [peerStatus, setPeerStatus] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callTime, setCallTime] = useState(0);
  const intervalRef = useRef<number | null>(null); // setInterval ID 저장

  const videoRef = useRef<VideoHandle | null>(null);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(params.code!)
    .then(() => {
      setCopyToast(true);
    })
    .catch(() => {
      alert('코드 복사에 실패했습니다.')
    })
  }

  const handleMic = () => {
    setIsMicActive((state) => !state);
  }

  const handleVideo = () => {
    setIsCameraActive((state) => !state);
  }

  const endCall = () => {
    videoRef.current?.endCallCleanup();
  
    setTimeout(() => {
      navigate('/call-end', {
        state: {
          callTime: formatTime(callTime, 'korean'),
          callStartTime: formatKoreanDate(callStartTime, 'korean'), 
        }
      })
    }, 200);
  }

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
      <div className={cn({
        [styles.code]: true,
        [styles['code__success-connect']]: peerStatus,
      })}>
        <input
          disabled
          value={params.code}
          className={styles.code__input}
        />
        <button
          className={styles.code__button}
          onClick={copyRoomCode}
        >
          Copy
        </button>
        {copyToast && (
          <div className={styles.toast}>
            <Toast setToast={setCopyToast} text='copied!' />
          </div>
        )}
      </div>
      <div
        className={cn({
          [styles.content]: true,
          [styles['content__success-connect']]: peerStatus,
        })}>
        <StyleSelect />
        <div>
          <div className={styles['video-chat__box']}>
            <div className={styles['video-chat__controls']}>
              <div>
                <button
                  className={styles['video-chat__controls--button']}
                  onClick={handleVideo}
                >
                  {isCameraActive ? <CameraIcon /> : <CameraBlcokIcon />}
                </button>
                <button
                  className={styles['video-chat__controls--button']}
                  onClick={handleMic}
                >
                  {isMicActive ? <MicIcon /> : <MicBlockIcon />}
                </button>
              </div>
              {peerStatus
              ? (
                <div className={styles['call-time']}>
                  <div className={styles['call-time__recording']}></div>
                  <div className={styles['call-time__time']}>{formatTime(callTime, 'digit')}</div>
                </div>
              )
              : (
                <div className={styles['connect-wait']}>
                  <img style={{width: '17px', height: '17px' }} src={LoadingSpinner} />
                  <div className={styles['connect-wait__text']}>상대방의 접속을 기다리고 있습니다.</div>
                </div>
              )}
              
              <button
                className={styles['video-chat__controls--button']}
                onClick={endCall}
              >
                <CallEndIcon />
              </button>
            </div>
            {params.code
            ?
              <Video
                ref={videoRef}
                peerStatus={peerStatus}
                setPeerStatus={setPeerStatus}
                code={params.code}
                isCameraActive={isCameraActive}
                isMicActive={isMicActive}
                callType='general'
                callStartTime={formatKoreanDate(callStartTime, 'digit')}
              />
            : <div>
                올바르지 않은 경로입니다.
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

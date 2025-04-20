// import { useState } from "react";
import { useEffect, useRef, useState } from 'react';
import styles from './EmergencyCallPage.module.scss';
import { useNavigate, useParams } from 'react-router-dom';
import CameraIcon from 'src/assets/camera.svg';
import CameraBlockIcon from 'src/assets/block-camera.svg';
import MicIcon from 'src/assets/mic.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import Lottie from 'lottie-react';
import videoLoading from 'src/assets/video-loading.json';
import Video from '../components/Video';
import EmergencyReportModal from '../components/EmergencyReportModal';

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

// 응급기관의 경우
// 1. 농인이 아직 안 들어온 경우
// 2. 농인이 들어온 경우

// 농인의 경우
// 1. 응급기관이 접수를 아직 안 한 경우
// 2. 응급기관이 접수를 한 경우

// 농인과 응급기관만 사용하는 페이지
export default function EmergencyCallPage() {
  const params = useParams();
  const navigate = useNavigate();

  const [isMicActive, setIsMicActive] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);

  const [peerStatus, setPeerStatus] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callTime, setCallTime] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const intervalRef = useRef<number | null>(null); // setInterval ID 저장

  const handleMic = () => {
    setIsMicActive((state) => !state);
  }
  
  const handleVideo = () => {
    setIsCameraActive((state) => !state);
  }
  
  const endCall = () => {
    navigate('/call-end', {
      state: {
        callTime: formatTime(callTime, 'korean'),
        callStartTime: formatKoreanDate(callStartTime, 'korean'), 
      }
    })
  };

  const openModal = () => {
    setIsModalOpen(true);
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
              {peerStatus
              ? (
                <div className={styles['call-time']}>
                  <div className={styles['call-time__recording']}></div>
                  <div className={styles['call-time__time']}>{formatTime(callTime, 'digit')}</div>
                </div>
              )
              : (
                <div className={styles['connect-wait']}>
                  <Lottie animationData={videoLoading} style={{ width: '17px', height: '17px' }}/>
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
                peerStatus={peerStatus}
                setPeerStatus={setPeerStatus}
                code={params.code}
                isCameraActive={isCameraActive}
                isMicActive={isMicActive}
                callType='emergency'
                callStartTime={formatKoreanDate(callStartTime, 'digit')}
              />
            : <div>
                올바르지 않은 경로입니다.
              </div>
            }
          </div>
        </div>
      </div>
      {isModalOpen && (
        <EmergencyReportModal setIsModalOpen={setIsModalOpen} />
      )}
      <button onClick={openModal}>테스트용 신고접수 모달 열기</button>
    </div>
  )
}

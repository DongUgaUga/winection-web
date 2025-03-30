import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import CameraIcon from 'src/assets/camera.svg';
import CameraBlcokIcon from 'src/assets/block-camera.svg';
import MicIcon from 'src/assets/mic.svg';
import MicBlockIcon from 'src/assets/block-mic.svg';
import CallEndIcon from 'src/assets/end-call.svg';
import styles from './GeneralCallPage.module.scss';

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

function StyleSelect() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);

  const [voice, setVoice] = useState(VOICES[0]);
  const [avatar, setAvatar] = useState(AVATARS[0].name);

  console.log(voice, avatar);
  
  return (
    <>
      {userInfo.userClassification === '농인'
        ? (
          <div className={styles.style}>
            <div className={styles.style__select}>목소리 선택</div>
            <div className={styles.voices}>
              {VOICES.map((v) => (
                <button
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
                <div className={styles.avatars__avatar} onClick={() => setAvatar(avatar.name)}>
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

export default function GeneralCallPage() {
  const params = useParams();
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleMic = () => {
    setIsMicActive((state) => !state);
  }

  const handleVideo = () => {
    setIsCameraActive((state) => !state);
  }

  return (
    <div className={styles.container}>
      <div className={styles.code}>
        <input
          disabled
          value={params.code}
          className={styles.code__input}
        />
        <button
          className={styles.code__button}  
        >
          Copy
        </button>
      </div>
      <div className={styles.content}>
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
              <div>녹화 주우우우우우웅</div>
              <button className={styles['video-chat__controls--button']}>
                <CallEndIcon />
              </button>
            </div>
            <div className={styles['video-chat__video']}>
              대충 비디오나오는 곳
            </div>
          </div>
          <p className={styles['video-chat__chat']}>
            대추웅우우우우ㅇ우우ㅜ우웅웅웅 텍스트
            <br />
            대추웅우우우우ㅇ우우ㅜ우웅웅웅 텍스트
            <br />
            대추웅우우우우ㅇ우우ㅜ우웅웅웅 텍스트
          </p>
        </div>
      </div>
    </div>
  )
}

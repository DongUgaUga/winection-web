import RecordIcon from 'src/assets/record.svg';
import KeyboardIcon from 'src/assets/keyboard.svg';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import useMakeRoomId from '../hooks/useMakeRoomId';
import styles from './GeneralCallWait.module.scss';

export default function GeneralCallWait() {
  const navigate = useNavigate();
  const { mutateAsync: makeRoomId } = useMakeRoomId();

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const makeNewCall = async () => {
    const newCode = await makeRoomId();
    navigate(`/general-call/${newCode.room_id}`);
  }

  const enterCallPage = () => {
    if (code.length !== 6) {
      setErrorMessage('6자리 코드를 입력해주세요.');
      return;
    }
    setErrorMessage('');
    navigate(`/general-call/${code}`);
  }

  return (
    <div className={styles['enter-call-container']}>
      <div className={styles['enter-call-container__call']}>
        <button
          className={styles['new-call']}
          onClick={makeNewCall}
        >
          <RecordIcon />
          <div>새 통화</div>
        </button>
        <div className={styles.participate}>
          <div className={cn({
            [styles.participate__code]: true,
            [styles['participate__code--error']]: errorMessage === '6자리 코드를 입력해주세요.',
          })}>
            <KeyboardIcon />
            <input
              onChange={(e) => setCode(e.target.value)}
              value={code}
              placeholder='코드 입력'
              className={styles['participate__code--input']}
            />
          </div>
          <button
            onClick={enterCallPage}
            className={cn({
              [styles.participate__button]: true,
              [styles['participate__button--activated']]: code.length === 6,
            })}
          >
            참가
          </button>
        </div>
      </div>
      {errorMessage && (
        <div className={styles.error}>{errorMessage}</div>
      )}
    </div> 
  )
}

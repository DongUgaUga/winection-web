import RecordIcon from 'src/assets/record.svg';
import KeyboardIcon from 'src/assets/keyboard.svg';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import styles from './GeneralCallWait.module.scss';

const generateRandomString = (length = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function GeneralCallWait() {
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const makeNewCall = () => {
    const newCode = generateRandomString();
    navigate(`/general-call/${newCode}`);
  }

  const handleCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  }

  const enterCallPage = () => {
    if (code.length !== 6) {
      setErrorMessage('6자리 코드를 입력해주세요.');
      return;
    }
    if (!isChecked) {
      setErrorMessage('위치 정보 동의에 체크해주세요.');
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
              [styles['participate__button--activated']]: code.length === 6 && isChecked,
            })}
          >
            참가
          </button>
        </div>
      </div>
      {errorMessage && (
        <div className={styles.error}>{errorMessage}</div>
      )}
      <label htmlFor='agree' className={styles.checkbox}>
        <input
          id='agree'
          type='checkbox'
          className={styles.checkbox__check}
          checked={isChecked}
          onChange={handleCheck}
        />
        <div className={styles.checkbox__agree}>참가하면 위치 정보 어쩌고에 동의</div>
      </label>
    </div> 
  )
}
import { useState } from 'react'
import DeleteIcon from 'src/assets/delete.svg';
import BlindIcon from 'src/assets/blind.svg';
import EyeIcon from 'src/assets/eye.svg';
import styles from './FindPasswordPage.module.scss'
import { useNavigate } from 'react-router-dom';

const PASSWORDREG = /^(?=.*[A-Za-z])(?=.*\d)(?=.*\W).{8,}.+$/;

export default function FindPasswordPage() {
  const navigate = useNavigate();

  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState(1);

  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [isBlind, setIsBlind] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');

  const handleStep = () => {
    if (step === 1) {
      // 비밀번호 찾기 api 추가 예정
      if (!id || !nickname) return;

      if (id === 'tmdwn1234' && nickname === '아마승주') {
        setErrorMessage('');
        setStep((value) => value + 1);
        return;
      }
      setErrorMessage('일치하는 회원 정보가 없습니다.');
    }
    if (step === 2) {
      if (!PASSWORDREG.test(password) || !PASSWORDREG.test(passwordCheck)) {
        setErrorMessage('비밀번호는 영문, 특수문자, 숫자를 포함한 8자리 이상이어야 합니다.')
        return;
      }
      if (password !== passwordCheck) {
        setErrorMessage('비밀번호가 일치하지 않습니다.')
        return;
      }

      setErrorMessage('');
      // 비밀번호 수정 api 추가 예정
      setStep((value) => value + 1);
      return;
    }
  }

  const goHome = () => {
    // 자동으로 로그인 되게 설정(로그인 api 나오면)
    sessionStorage.setItem('userInfo', JSON.stringify({ nickname: '아마승주', userClassification: '농인' }));
    navigate('/');
  }

  return (
    <>
      {step === 1 && (
        <div className={styles.container}>
          <div className={styles.container__step}>
            비밀번호를 찾고자하는 아이디를 입력해주세요.
          </div>
          <div className={styles.form}>
            <div className={styles.form__input}>
              <input
                type='text'
                className={styles['form__input--text']}
                placeholder='아이디를 입력하세요.'
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <button
                className={styles['form__input--delete']}
                onClick={() => setId('')}
                tabIndex={-1}
              >
                <DeleteIcon />
              </button>
            </div>
            <div className={styles.form__input}>
              <input
                type='text'
                className={styles['form__input--text']}
                placeholder='닉네임을 입력하세요.'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <button
                className={styles['form__input--delete']}
                onClick={() => setNickname('')}
                tabIndex={-1}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
          {errorMessage && <div className={styles['error-message']}>{errorMessage}</div>}
          <button
            className={styles.container__button}
            onClick={handleStep}
          >
            다음
          </button>
        </div>
      )}
      {step === 2 && (
        <div className={styles.container}>
          <div className={styles.container__step}>
            새로운 비밀번호를 입력해주세요.
          </div>
          <div className={styles.form}>
            <div className={styles.form__input}>
              <input
                type='password'
                className={styles['form__input--text']}
                placeholder='새로운 비밀번호를 입력해주세요.'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className={styles['form__input--delete']}
                onClick={() => setPassword('')}
                tabIndex={-1}
              >
                <DeleteIcon />
              </button>
            </div>
            <div className={styles.form__input}>
              <input
                type={isBlind ? 'password' : 'text'}
                className={styles['form__input--text']}
                placeholder='새로운 비밀번호를 한 번 더 입력해주세요.'
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
              />
              <button
                className={styles['form__input--delete']}
                onClick={() => setIsBlind((value) => !value)}
              >
                {isBlind ? <BlindIcon /> : <EyeIcon />}
              </button>
              <button
                className={styles['form__input--delete']}
                onClick={() => setPasswordCheck('')}
                tabIndex={-1}
              >
                <DeleteIcon />
              </button>
            </div>
          </div>
          {errorMessage && <div className={styles['error-message']}>{errorMessage}</div>}
          <button
            className={styles.container__button}
            onClick={handleStep}
          >
            다음
          </button>
        </div>
      )}
      {step === 3 && (
        <div className={styles['final-step']}>
          <div className={styles['final-step__description']}>
            새로운 비밀번호 설정이 완료되었습니다.
          </div>
          <button
            className={styles['final-step__button']}
            onClick={goHome}
          >
            홈으로
          </button>
        </div>
      )}
      
    </>
  )
}
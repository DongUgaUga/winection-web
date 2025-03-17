import { SetStateAction, useState } from 'react';
import DeleteIcon from 'src/assets/delete.svg';
import BlindIcon from 'src/assets/blind.svg';
import EyeIcon from 'src/assets/eye.svg';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState<boolean>(false);
  const [isError, setIsError] = useState(false);

  const currentId = (e: { target: { value: SetStateAction<string>; }; }) => {
    setId(e.target.value);
  };

  const currentPw = (e: { target: { value: SetStateAction<string>; }; }) => {
    setPw(e.target.value);
  };

  const deleteIdHandler = () => {
    setId('');
  };

  const deletePwHandler = () => {
    setPw('');
  };

  const onSubmit = () => {
    if (!id || !pw) {
      setIsError(true);
      return;
    }
    
    // 로그인 api 나오면 없앨 예정
    if (id !== 'tmdwn1234' || pw !== '!tmdwn1234') {
      setIsError(true);
      return;
    }
    sessionStorage.setItem('userInfo', JSON.stringify({ nickname: '아마승주', userClassification: '농인' }));

    setIsError(false);
    navigate('/');
    return;
  };

  const toggleShowPw = () => {
    setShowPw((prev) => !prev);
  };

  return (
    <div className={styles.container}>
      <div className={styles.container__input}>
        <div className={styles['container__input--field-id']}>
          <input
            placeholder='아이디를 입력하세요.'
            className={styles['container__input--text']}
            onChange={currentId}
            value={id}
          />
          <button
            onClick={deleteIdHandler}
            className={styles['container__input--icon']}
            tabIndex={-1}
          >
            <DeleteIcon />
          </button>
        </div>

        <div className={styles['container__input--field-pw']}>
          <input
            type={showPw ? "text" : "password"}
            placeholder='비밀번호를 입력하세요.'
            className={styles['container__input--text']}
            onChange={currentPw} 
            value={pw}
          />
          <div className={styles['container__input--icons']}>
            <button
              onClick={toggleShowPw}
              className={styles['container__input--icon']}
              tabIndex={-1}
            >
              {showPw ? <EyeIcon /> : <BlindIcon />}
            </button>
            <button
              onClick={deletePwHandler}
              className={styles['container__input--icon']}
              tabIndex={-1}
            >
              <DeleteIcon />
            </button>
          </div>
        </div>
      </div>
      <div>
        {isError && (
          <div className={styles.error}>아이디 또는 비밀번호를 다시 확인해 주세요.</div>
        )}
        <button
          className={styles.container__submit}
          onClick={onSubmit}
        >
          로그인
        </button>
      </div>

      <div className={styles['find-wrap']}>
        <button className={styles['find-wrap__button']} onClick={() => navigate('/auth/find-pw')}>비밀번호 찾기</button>
        <div>|</div>
        <button className={styles['find-wrap__button']} onClick={() => navigate('/auth/signup')}>회원가입</button>
      </div>
    </div>
  )
}

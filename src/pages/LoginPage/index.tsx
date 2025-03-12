import { SetStateAction, useState } from 'react';
import DeleteIcon from 'src/assets/delete.svg';
import BlindIcon from 'src/assets/blind.svg';
import EyeIcon from 'src/assets/eye.svg';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState<boolean>(false);

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

  const onSubmit = (data: any) => {
    console.log(data)
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
          ></input>
          <button
            onClick={deleteIdHandler}
            className={styles['container__input--icon']}
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
          ></input>
          <div className={styles['container__input--icons']}>
          <button
              onClick={toggleShowPw}
              className={styles['container__input--icon']}
            >
              {showPw ? <EyeIcon /> : <BlindIcon />}
            </button>
            <button
              onClick={deletePwHandler}
              className={styles['container__input--icon']}
            >
              <DeleteIcon />
          </button>
          </div>
        </div>
      </div>

      <button
        className={styles.container__submit}
        onClick={onSubmit}
      >
        로그인
      </button>

      <ul className={styles['find-wrap']}>
        <li>
          <a className={styles['find-wrap__text-pw']}>비밀번호 찾기</a>
        </li>
        <li>
          <a className={styles['find-wrap__text-join']}>회원가입</a>
        </li>
      </ul>
    </div>
  )
}

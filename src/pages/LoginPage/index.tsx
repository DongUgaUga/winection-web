import DeleteButton from 'src/assets/delete.svg';
import NoSee from 'src/assets/no-see.svg';
import styles from './LoginPage.module.scss';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.container__input}>
        <div className={styles['container__input--field-id']}>
          <input
            placeholder='아이디를 입력하세요.'
            className={styles['container__input--text']}
          ></input>
          <DeleteButton />
        </div>

        <div className={styles['container__input--field-pw']}>
          <input
            placeholder='비밀번호를 입력하세요.'
            className={styles['container__input--text']} 
          ></input>
          <div className={styles['container__input--icons']}>
            <NoSee />
            <DeleteButton />
          </div>
        </div>
      </div>

      <button className={styles.container__submit}>
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
import { useNavigate } from "react-router-dom"
import GirlImage from 'src/assets/index-girl.svg';
import ManImage from 'src/assets/index-man.svg';
import styles from './IndexPage.module.scss';

export default function IndexPage() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);
  console.log(userInfo);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.content__left}>
          <div className={styles['content__main-text']}>
            <span className={styles['content__main-text--name']}>Winection</span> 으로 소통의 한계를 뛰어넘어 보세요.
          </div>
          <p className={styles.content__description}>
            Winection은 <span>응급 상황에서 신속한 대응을 위해</span> 긴급 통화 중 사용자의
            <br />
            위치 정보를 GPS를 통해 공유합니다. 이를 통해 보다 정확하고 빠른 지원이
            <br />
            이루어질 수 있도록 돕습니다.
          </p>
          <GirlImage />
        </div>
        <div className={styles.content__right}>
          <ManImage />
        </div>
      </div>
      <div className={styles['button-container']}>
        <button className={styles['button-container__button']} onClick={() => navigate('/auth')}>로그인</button>
        <button className={styles['button-container__button']} onClick={() => navigate('/auth/signup')}>회원가입</button>
      </div>
      {/*추후 삭제 예정*/}
      <div className={styles.buttonsss}>
        <button onClick={() => navigate('/ts')}>ts</button>
        <button onClick={() => navigate('/stsl')}>stsl</button>
        <button onClick={() => navigate('/slts')}>slts</button>
      </div>
    </div>
  )
}
import { useNavigate } from "react-router-dom"
import GirlImage from 'src/assets/index-girl.svg';
import ManImage from 'src/assets/index-man.svg';
import styles from './NonLoginView.module.scss';
import useBreakpoint from "../../../utils/hooks/useBreakPoint";
import WinectionLogo from '/src/assets/winection.svg';

export default function NonLoginView() {
  const breakPoint = useBreakpoint();
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      {breakPoint !== 'mobile' ? (
        <div className={styles.content}>
          <div className={styles.content__introduce}>
            <div className={styles['content__main-text']}>
              <span className={styles['content__main-text--name']}>Winection</span> 으로 소통의 한계를 뛰어넘어 보세요.
            </div>
            <p className={styles.content__description}>
              Winection은 <span>양방향 수어 번역 화상채팅 서비스</span>로 온라인 환경에서 농인들의 원활한 소통을 지원합니다.
              <br />
              <br />
              농인들에게는 목소리를 선물하고, 실제 목소리를 수어로 바꾸어 보여주는 화상채팅 플랫폼,
              <br />
              지금 <span>Winection</span>에서 만나보세요.
            </p>
          </div>
          <div className={styles.content__image}>
            <GirlImage />
            <ManImage />
          </div>
        </div>
      ) : (
        <WinectionLogo />
      )}
      <div className={styles['button-container']}>
        <div className={styles['button-container__content']}>
          {breakPoint === 'mobile' && <div className={styles['button-container__description']}><span>기존 회원</span>이라면 여기!</div>}
          <button className={styles['button-container__button']} onClick={() => navigate('/auth')}>로그인</button>
        </div>
        <div className={styles['button-container__content']}>
          {breakPoint === 'mobile' && <div className={styles['button-container__description']}><span>신규 회원</span>이라면 여기!</div>}
          <button className={styles['button-container__button']} onClick={() => navigate('/auth/signup')}>회원가입</button>
        </div>
      </div>
    </div>
  )
}
import { cn } from '@bcsdlab/utils';
import GrandfatherAvatar from 'src/assets/grandfather-avatar.svg';
import { useNavigate } from 'react-router-dom';
import styles from './LoginView.module.scss';
import useUserInfo from '../../../hooks/useUserInfo';

export default function LoginView() {
  const { data: userInfo } = useUserInfo();
  const userClassification = userInfo.user_type;
  const navigate = useNavigate();

  const startCall = () => {
    if (userClassification === '일반인') {
      navigate('/general-call');
    } else {
      // 신고 접수 대기 페이지로 이동
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.motto}>
        <div>오늘도 우리는,</div>
        <div><span className={styles.emphasize}>소통</span><span className={styles.gradient}>을 위해 달려나갑니다.</span></div>
        {userClassification === '농인'
        ? (
          <div className={styles.call}>
            <div className={styles['call__type']}>
              <GrandfatherAvatar />
              <button className={styles.call__button} onClick={() => navigate('/general-call')}>영상통화</button>
            </div>
            <div className={styles['call__type']}>
              <GrandfatherAvatar />
              <button className={styles.call__button} onClick={() => navigate('/emergency-call')}>긴급통화</button>
            </div>
          </div>
        ) : (
          <div className={styles['general-call']}>
            <button
              className={cn({
                [styles.call__button]: true,
                [styles['call__button--start']]: true,
              })}
              onClick={startCall}
            >
              {userClassification === '일반인' ? '영상통화 시작하기' : '신고 접수 대기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
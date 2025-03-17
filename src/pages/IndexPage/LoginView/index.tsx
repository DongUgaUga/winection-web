import { cn } from '@bcsdlab/utils';
import styles from './LoginView.module.scss';
import GrandfatherAvatar from 'src/assets/grandfather-avatar.svg';

export default function LoginView() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);
  const userClassification = userInfo.userClassification;

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
              <button className={styles.call__button}>영상통화</button>
            </div>
            <div className={styles['call__type']}>
              <GrandfatherAvatar />
              <button className={styles.call__button}>긴급통화</button>
            </div>
          </div>
        ) : (
          <div className={styles['general-call']}>
            <button className={cn({
              [styles.call__button]: true,
              [styles['call__button--start']]: true,
            })}>
              {userClassification === '일반인' ? '영상통화 시작하기' : '신고 접수 대기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
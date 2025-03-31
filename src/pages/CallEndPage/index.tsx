import ReturnIcon from 'src/assets/return.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CallEndPage.module.scss';

export default function CallEndPage() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);

  const location = useLocation();
  const navigate = useNavigate();
  const callTimeState = location.state;

  return (
    <div className={styles.container}>
      <div className={styles.guide}>
        <div>연결이 종료되었습니다.</div>
        <div><span>{userInfo.nickname}</span>님, 통화는 어떠셨나요?</div>
      </div>
      <div className={styles.call}>
        <div className={styles.call__time}>
          <span>통화 시작 시간 </span>
          <span>{callTimeState.callStartTime}</span>
        </div>
        <div className={styles.call__time}>
          <span>통화 지속 시간</span>
          <span>{callTimeState.callTime}</span>
        </div>
      </div>
      <button
       className={styles.return}
       onClick={() => navigate('/')}
      >
        <div>메인페이지로</div>
        <ReturnIcon />
      </button>
    </div>
  )
}
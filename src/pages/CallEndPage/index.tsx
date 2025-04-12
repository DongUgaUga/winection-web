import ReturnIcon from 'src/assets/return.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './CallEndPage.module.scss';
import useUserInfo from '../../hooks/useUserInfo';

export default function CallEndPage() {
  const { data: userInfo } = useUserInfo();

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
          <span>통화 시작 시간</span>
          <div>{callTimeState.callStartTime}</div>
        </div>
        <div className={styles.call__time}>
          <span>통화 지속 시간</span>
          <div>{callTimeState.callTime}</div>
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
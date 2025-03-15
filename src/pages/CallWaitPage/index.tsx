import { useParams } from 'react-router-dom';
import styles from './CallWaitPage.module.scss';
import GeneralCallWait from './GeneralCallWait';

export default function CallWatiPage() {
  // const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);
  // const userClassification = userInfo.userClassification;
  const param = useParams();
  console.log(param);
  
  return (
    <div className={styles.container}>
      <div className={styles.motto}>
        <div>오늘도 우리는,</div>
        <div><span className={styles.emphasize}>소통</span><span className={styles.gradient}>을 위해 달려나갑니다.</span></div>
      </div>
      <div className={styles['before-call']}>
        {param.calltype === 'general-call'
          ?
            <GeneralCallWait />
          :
          <div></div>
        }
      </div>
    </div>
  )
}
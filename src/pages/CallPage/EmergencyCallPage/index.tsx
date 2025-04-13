// import { useState } from "react";
import styles from './EmergencyCallPage.module.scss';

// 응급기관의 경우
// 1. 농인이 아직 안 들어온 경우
// 2. 농인이 들어온 경우

// 농인의 경우
// 1. 응급기관이 접수를 아직 안 한 경우
// 2. 응급기관이 접수를 한 경우


// 농인과 응급기관만 사용하는 페이지
export default function EmergencyCallPage() {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);
  
  // const [peerStatus, setPeerStatus] = useState(false);
  

  return (
    <div className={styles.container}>
      {userInfo === ''}
      <div>
        
      </div>
    </div>
  )
}

import { useNavigate } from "react-router-dom"
import LoginView from "./LoginView/index.tsx";
import NonLoginView from "./NonLoginView/index.tsx";
import styles from './IndexPage.module.scss';

export default function IndexPage() {
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!); // 로그인 여부 판단. 추후 다른 방식으로 변경할 수도
  console.log(userInfo);

  return (
    <>
      {userInfo
      ? <LoginView />
      : <NonLoginView />
      }
      {/*추후 삭제 예정*/}
      <div className={styles.buttonsss}>
        <button onClick={() => navigate('/ts')}>ts</button>
        <button onClick={() => navigate('/stsl')}>stsl</button>
        <button onClick={() => navigate('/slts')}>slts</button>
      </div>
    </>
  )
}
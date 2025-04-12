import { useNavigate } from "react-router-dom"
import LoginView from "./LoginView/index.tsx";
import NonLoginView from "./NonLoginView/index.tsx";
import styles from './IndexPage.module.scss';
import useTokenState from "../../hooks/useTokenState.ts";

export default function IndexPage() {
  const navigate = useNavigate();
  const token = useTokenState();

  return (
    <>
      {token
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
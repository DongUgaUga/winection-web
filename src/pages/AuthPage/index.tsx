import { Outlet, useNavigate } from 'react-router-dom';
import WinectionIcon from 'src/assets/winection.svg';
import styles from './AuthPage.module.scss';

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles['container--logo']} onClick={() => navigate('/')}>
        <WinectionIcon />
      </div>
      <Outlet />
    </div>
  )
}
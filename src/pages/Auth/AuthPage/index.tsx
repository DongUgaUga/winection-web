import { Outlet, useNavigate } from 'react-router-dom';
import WinectionIcon from 'src/assets/winection.svg';
import styles from './AuthPage.module.scss';
import useBreakpoint from '../../../utils/hooks/useBreakPoint';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function AuthPage() {
  const navigate = useNavigate();
  const breakPoint = useBreakpoint();

  return (
    <>
      {breakPoint === 'mobile' && (
        <Header />
      )}
      <div className={styles.container}>
       <div className={styles['container--logo']} onClick={() => navigate('/')}>
         <WinectionIcon />
       </div>
       <Outlet />
      </div>
      {breakPoint === 'mobile' && (
        <Footer />
      )}
    </>   
  )
}
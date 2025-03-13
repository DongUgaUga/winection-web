import WinectionLogo from '/src/assets/winection.svg';
import styles from './Header.module.scss';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      <div className={styles.header__logo} onClick={() => navigate('/')}>
        <WinectionLogo />
      </div>
      <div className={styles.header__menu}>
        <button className={styles['header__menu--button']}>소개</button>
        <button className={styles['header__menu--button']}>개발자</button>
        <button className={styles['header__menu--button']}>로그인</button>
      </div>
    </div>
  )
}
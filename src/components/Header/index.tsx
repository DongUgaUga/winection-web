import WinectionLogo from '/src/assets/winection.svg';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import useUserInfo from '../../hooks/useUserInfo';
import useBreakpoint from '../../utils/hooks/useBreakPoint';

export default function Header() {
  const { data: userInfo } = useUserInfo();
  const navigate = useNavigate();
  const breakPoint = useBreakpoint();

  const logout = () => {
    localStorage.removeItem('accessToken');
    navigate('/');
  }

  const login = () => {
    navigate('/auth');
  }

  const about = () => {
    navigate('/about');
  }

  return (
    <div className={styles.header}>
      {breakPoint !== 'mobile' && (
        <div className={styles.header__logo} onClick={() => navigate('/')}>
          <WinectionLogo />
        </div>
      )}
      {userInfo
      ? (
        <div className={styles.header__user}>
          <div className={styles['header__user--greet']}>
            <span>{userInfo.nickname} </span>
            님, 반갑습니다!
          </div>
          <button className={styles['header__user--logout']} onClick={logout}>로그아웃</button>
        </div>
      )
      : (
        <div className={styles.header__menu}>
          <button className={styles['header__menu--button']} onClick={about}>소개</button>
          <button className={styles['header__menu--button']}>개발자</button>
          <button className={styles['header__menu--button']} onClick={login}>로그인</button>
        </div>
      )}
    </div>
  )
}
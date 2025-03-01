import WinectionLogo from '/src/assets/winection.svg';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <div className={styles.header}>
      <WinectionLogo />
      <div className={styles.header__menu}>
        <button className={styles['header__menu--button']}>소개</button>
        <button className={styles['header__menu--button']}>개발자</button>
        <button className={styles['header__menu--button']}>로그인</button>
      </div>
    </div>
  )
}
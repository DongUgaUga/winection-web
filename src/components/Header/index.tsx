import WinectionLogo from '/src/assets/winection.svg';
import LeftChevron from '/src/assets/chevron-left.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import useUserInfo from '../../hooks/useUserInfo';
import useBreakpoint from '../../utils/hooks/useBreakPoint';
import { cn } from '@bcsdlab/utils';

export default function Header() {
	const { data: userInfo } = useUserInfo();
	const navigate = useNavigate();
	const breakPoint = useBreakpoint();
	const params = useLocation();
	const isMainPage = params.pathname === '/';
	const isAuthPage =
		params.pathname === '/auth/signup' ||
		params.pathname === '/auth' ||
		params.pathname === '/auth/find-pw';

	const logout = () => {
		localStorage.removeItem('accessToken');
		navigate('/');
	};

	const login = () => {
		navigate('/auth');
	};

	const about = () => {
		navigate('/about');
	};

	return (
		<div
			className={cn({
				[styles.header]: true,
				[styles.header__auth]: isAuthPage,
			})}
		>
			{breakPoint !== 'mobile' ? (
				<button className={styles.header__logo} onClick={() => navigate('/')}>
					<WinectionLogo />
				</button>
			) : (
				<button
					className={cn({
						[styles.header__back]: true,
						[styles['header__back--hidden']]: isMainPage,
					})}
					onClick={() => navigate(-1)}
				>
					<LeftChevron />
				</button>
			)}
			{userInfo ? (
				<div className={styles.header__user}>
					<div className={styles['header__user--greet']}>
						<span>{userInfo.nickname} </span>
						님, 반갑습니다!
					</div>
					<button className={styles['header__user--logout']} onClick={logout}>
						로그아웃
					</button>
				</div>
			) : (
				<div
					className={cn({
						[styles.header__menu]: true,
						[styles['header__menu--hidden']]: isAuthPage,
					})}
				>
					<button className={styles['header__menu--button']} onClick={about}>
						소개
					</button>
					<button className={styles['header__menu--button']}>개발자</button>
					<button className={styles['header__menu--button']} onClick={login}>
						로그인
					</button>
				</div>
			)}
		</div>
	);
}

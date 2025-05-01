import { Outlet, useNavigate } from 'react-router-dom';
import WinectionIcon from 'src/assets/winection.svg';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import useBreakpoint from '../../utils/hooks/useBreakPoint';
import styles from './Auth.module.scss';

export default function Auth() {
	const navigate = useNavigate();
	const breakPoint = useBreakpoint();

	return (
		<>
			{breakPoint === 'mobile' && <Header />}
			<div className={styles.container}>
				<button
					className={styles['container--logo']}
					onClick={() => navigate('/')}
				>
					<WinectionIcon />
				</button>
				<Outlet />
			</div>
			{breakPoint === 'mobile' && <Footer />}
		</>
	);
}

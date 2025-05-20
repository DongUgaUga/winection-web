import { useNavigate } from 'react-router-dom';
import useTokenState from '../../hooks/useTokenState.ts';
import styles from './IndexPage.module.scss';
import LoginView from './LoginView/index.tsx';
import NonLoginView from './NonLoginView/index.tsx';

export default function IndexPage() {
	const navigate = useNavigate();
	const token = useTokenState();
	console.log('[지도 ClientID]', import.meta.env.VITE_NAVERMAP_CLIENT_ID);

	return (
		<>
			{token ? <LoginView /> : <NonLoginView />}
			{/*추후 삭제 예정*/}
			<div className={styles.buttonsss}>
				<button onClick={() => navigate('/ts')}>ts</button>
				<button onClick={() => navigate('/stsl')}>stsl</button>
				<button onClick={() => navigate('/slts')}>slts</button>
				<button onClick={() => navigate('/unity')}>unity</button>
			</div>
		</>
	);
}

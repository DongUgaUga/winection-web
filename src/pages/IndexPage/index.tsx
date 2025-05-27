import useTokenState from '../../hooks/useTokenState.ts';
import LoginView from './LoginView/index.tsx';
import NonLoginView from './NonLoginView/index.tsx';

export default function IndexPage() {
	const token = useTokenState();

	return token ? <LoginView /> : <NonLoginView />;
}

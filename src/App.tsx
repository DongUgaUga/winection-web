import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AboutPage from './pages/AboutPage';
import Auth from './pages/Auth';
import FindPasswordPage from './pages/Auth/FindPasswordPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import BoardPage from './pages/BoardPage';
import CallEndPage from './pages/CallEndPage';
import CallPage from './pages/CallPage';
import CallWaitPage from './pages/CallWaitPage';
import IndexPage from './pages/IndexPage';

function App() {
	// Unity preload 및 초기화 (App에서 preload)
	useEffect(() => {
		const canvas = document.createElement('canvas');
		canvas.id = 'unity-canvas';
		canvas.style.display = 'none'; // 숨김 처리
		document.body.appendChild(canvas);

		const script = document.createElement('script');
		script.src = '/unity-build/Build/unity-build.loader.js';
		script.onload = () => {
			// loader가 로드되면 createUnityInstance 호출
			if ((window as any).createUnityInstance) {
				(window as any)
					.createUnityInstance(canvas, {
						dataUrl: '/unity-build/Build/unity-build.data',
						frameworkUrl: '/unity-build/Build/unity-build.framework.js',
						codeUrl: '/unity-build/Build/unity-build.wasm',
					})
					.then((instance: any) => {
						(window as any).unityInstance = instance;
						console.log('✅ Unity 초기화 완료 (App에서 preload)');
					})
					.catch((err: any) => {
						console.error('❌ Unity 초기화 실패:', err);
					});
			}
		};
		document.body.appendChild(script);
	}, []);
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<BoardPage />}>
						<Route path="/" element={<IndexPage />} />
						<Route path="/:calltype" element={<CallWaitPage />} />
						<Route path="/:calltype/:code" element={<CallPage />} />
						<Route path="/call-end" element={<CallEndPage />} />
					</Route>
					<Route path="/auth" element={<Auth />}>
						<Route index element={<LoginPage />} />
						<Route path="/auth/signup" element={<SignupPage />} />
						<Route path="/auth/find-pw" element={<FindPasswordPage />} />
					</Route>
					<Route path="/about" element={<AboutPage />} />
				</Routes>
				<ToastContainer />
			</BrowserRouter>
		</>
	);
}

export default App;

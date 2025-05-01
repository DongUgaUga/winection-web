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
import STTWebSocket from './pages/ToSign';
import VideoChatHandTracking from './pages/ToSpeech';
import TranslatePage from './pages/ts';
import UnityPage from './pages/UnityPlayer';

function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<BoardPage />}>
						<Route path="/" element={<IndexPage />} />
						<Route path="/:calltype" element={<CallWaitPage />} />
						<Route path="/:calltype/:code" element={<CallPage />} />
						<Route path="/call-end" element={<CallEndPage />} />
						<Route path="/ts" element={<TranslatePage />} />
						<Route path="/stsl" element={<STTWebSocket />} />
						<Route path="/slts" element={<VideoChatHandTracking />} />
					</Route>
					<Route path="/auth" element={<Auth />}>
						<Route index element={<LoginPage />} />
						<Route path="/auth/signup" element={<SignupPage />} />
						<Route path="/auth/find-pw" element={<FindPasswordPage />} />
					</Route>
					<Route path="/about" element={<AboutPage />} />
					<Route path="/unity" element={<UnityPage />} />
				</Routes>
				<ToastContainer />
			</BrowserRouter>
		</>
	);
}

export default App;

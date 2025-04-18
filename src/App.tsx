import { BrowserRouter, Route, Routes } from 'react-router-dom'
import VideoChatHandTracking from './pages/ToSpeech'
import STTWebSocket from './pages/ToSign'
import TranslatePage from './pages/ts'
import IndexPage from './pages/IndexPage'
import BoardPage from './pages/BoardPage'
import AuthPage from './pages/AuthPage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import FindPasswordPage from './pages/FindPasswordPage'
import CallWaitPage from './pages/CallWaitPage'
import CallPage from './pages/CallPage'
import AboutPage from './pages/AboutPage'
import CallEndPage from './pages/CallEndPage'
import { ToastContainer } from 'react-toastify'

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
          <Route path="/auth" element={<AuthPage />}>
            <Route index element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/find-pw" element={<FindPasswordPage />} />
          </Route>
          <Route path="/about" element={<AboutPage />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </>
  )
}

export default App

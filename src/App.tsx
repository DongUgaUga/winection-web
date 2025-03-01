import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import VideoChatHandTracking from './pages/slts'
import STTWebSocket from './pages/stsl'
import TranslatePage from './pages/ts'
import IndexPage from './pages/IndexPage'
import BoardPage from './pages/BoardPage'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BoardPage />}>
            <Route path="/" element={<IndexPage />} />
            <Route path="/ts" element={<TranslatePage />} />
            <Route path="/stsl" element={<STTWebSocket />} />
            <Route path="/slts" element={<VideoChatHandTracking />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App

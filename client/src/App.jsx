import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Signin from './pages/Signin'
import Dashboard from './Components/Dashboard'
import Homes from './pages2/Homes'
import Notiser from './pages2/Notiser'
import Arenden from './pages2/Arenden'
import Analys from './pages2/Analys'
import Anvandare from './pages2/Anvandare'
import Message from './pages2/Message'
import Layout from './pages/Layout'
import Admin from './pages/Admin'
import ChatPage from './pages/ChatPage'
import Kontakt from './pages2/Kontakt'
import Password from './pages/Password'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/homes" element={<Homes />} />
        <Route path="/notiser" element={<Notiser />} />
        <Route path="/ärenden" element={<Arenden />} />
        <Route path="/analys" element={<Analys />} />
        <Route path="/användare" element={<Anvandare />} />
        <Route path="/message" element={<Message />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/Kontakt" element={<Kontakt />} />
        <Route path="/chat/:chatToken" element={<ChatPage />} />
        <Route path="/password" element={<Password />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App

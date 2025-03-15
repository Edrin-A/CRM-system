import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Signin from './pages/Signin'
import Signup from "./pages/Signup"
import Dashboard from './Components/Dashboard'
import Homes from './pages2/Homes'
import Arenden from './pages2/Arenden'
import Analys from './pages2/Analys'
import Message from './pages2/Message'
import Layout from './pages/Layout'
import Admin from './pages/Admin'
import ChatPage from './pages/ChatPage'
import Password from './pages/Password'
import ProtectedRoute from './Components/ProtectedRoute'


// för routes som kräver inloggning men inte en specifik roll använder vi bara <ProtectedRoute> utan att ange requiredRole
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/homes" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Homes />
          </ProtectedRoute>
        } />
        <Route path="/ärenden" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Arenden />
          </ProtectedRoute>
        } />
        <Route path="/analys" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Analys />
          </ProtectedRoute>
        } />
        <Route path="/message" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Message />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Admin />
          </ProtectedRoute>
        } />
        <Route path="/Password" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Password />
          </ProtectedRoute>
        } />
        <Route path="/chat/:chatToken" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

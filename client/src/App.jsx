import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Komponenter
import ProtectedRoute from './Components/ProtectedRoute'

// Sidor
import Home from './pages/Home'
import Signin from './pages/Signin'
import Signup from "./pages/Signup"
import Layout from './pages/Layout'
import Admin from './pages/Admin'
import ChatPage from './pages/ChatPage'
import Password from './pages/Password'

// Dashboard-sidor
import Dashboard from './Components/Dashboard'
import Homes from './pages2/Homes'
import Arenden from './pages2/Arenden'
import Analys from './pages2/Analys'
import Message from './pages2/Message'


// för routes som kräver inloggning men inte en specifik roll använder vi bara <ProtectedRoute> utan att ange requiredRole
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Öppna routes, tillgängliga för alla */}
        <Route path="/" element={<Layout />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat/:chatToken" element={<ChatPage />} />

        {/* Skyddade routes, kräver inloggning men ingen specifik roll */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Support routes, kräver SUPPORT roll (eller ADMIN) */}
        <Route path="/homes" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Homes />
          </ProtectedRoute>
        } />
        <Route path="/arenden" element={
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
        <Route path="/password" element={
          <ProtectedRoute requiredRole="SUPPORT">
            <Password />
          </ProtectedRoute>
        } />

        {/* kräver ADMIN roll */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="ADMIN">
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App

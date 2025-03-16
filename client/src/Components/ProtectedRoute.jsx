import { useContext, useEffect, useState, useRef } from 'react'
import { Navigate } from 'react-router'
import { GlobalContext } from '../GlobalContext.jsx'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, getLogin } = useContext(GlobalContext)
  const [isLoading, setIsLoading] = useState(true)
  // useRef skapar en mutable referens som behåller sitt värde mellan renderingar
  // till skillnad från useState triggar ändringar i useRef inte en ny rendering
  // detta hjälper oss att förhindra att alert visas flera gånger vilket det gjorde tidigare
  const alertShownRef = useRef(false)

  // kontrollerar användarens autentiseringsstatus när komponenten laddas
  // om användaren inte är inloggad, försöker vi hämta inloggningsinformation från servern
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        await getLogin()
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  // visar en laddningsindikator medan vi kontrollerar autentiseringsstatus
  if (isLoading) {
    return <div>Loading...</div>
  }

  // om användaren inte är inloggad, omdirigera till inloggningssidan
  if (!user) {
    return <Navigate to='/signin' replace />
  }

  // kontrollera om användaren har rätt behörighet för att se denna sida
  // om användaren inte har rätt roll och inte är ADMIN, visa alert och omdirigera
  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    // kontrollera om alert redan har visats för att förhindra upprepade alerts
    // detta löser problemet med att alert visas flera gånger under renderingscykeln
    if (!alertShownRef.current) {
      // markera att alert har visats så att den inte visas igen
      alertShownRef.current = true
      // visa meddelande till användaren om att de saknar behörighet
      alert(`Du har inte behörighet att se denna sida. Du behöver vara ${requiredRole}.`)
    }
    // omdirigera användaren till en sida de har behörighet att se
    return <Navigate to='/homes' replace />
  }

  // om användaren har rätt behörighet, visa sidans innehåll
  return children
}
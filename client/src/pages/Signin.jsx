import { useContext } from 'react'
import { GlobalContext } from "../GlobalContext.jsx"
import { useNavigate } from 'react-router';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna 

import Shape from '../assets/Shape.png'; // Lägg till denna import

export default function Signin() {
  const { getLogin } = useContext(GlobalContext)
  const navigate = useNavigate();

  async function login(formData) {
    const response = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password")
      })
    })
    const data = await response.json()
    if (response.ok) {
      await getLogin()
      navigate("/homes") // skicka till startsidan
    } else {
      alert(data.message || "Inloggning misslyckades")
    }
  }

  return (
    <div className='homeWrapper'>
      <div className='contentWrapper'>
        <div className='Logo'>
          <img src={Shape} alt='Shape' />
        </div>
        <div className='formWrapper'>
          <h1 className='signin-title'>Logga in</h1>
          <form action={login} className='formWrapper'>
            <input type='text' name="username" placeholder='Användarnamn' className='inputField' required />
            <input type='password' name="password" placeholder='Lösenord' className='inputField' required />
            <button type="submit" className='SigninButton-signin'>Logga in</button>
          </form>
        </div>
      </div>
    </div>
  );
}

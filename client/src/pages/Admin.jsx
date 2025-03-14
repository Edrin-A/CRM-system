import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../Components/button';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna
import Shape from '../assets/Shape.png'; // Lägg till denna import

export default function Admin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Ny state för bekräftelsemeddelande

  function handleOnHome() {
    navigate("/Home");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // Skicka formulärdata till backend
      const formResponse = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Password: password,
          Email: email,
          Role: role
        })
      });

      if (formResponse.ok) {
        // Skicka bekräftelsemail
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            To: email,
            Subject: "Bekräftelse på din registrering",
            Body: `
              <h2>Tack för din registrering!</h2>
              <p>Dina uppgifter:</p>
              <ul>
                <li>Användarnamn: ${username}</li>
                <li>Roll: ${role}</li>
              </ul>
              <p>Vänligen håll denna information säker.</p>
            `
          })
        });

        if (emailResponse.ok) {
          setIsSubmitted(true);
          // Återställ formuläret
          setUsername("");
          setPassword("");
          setEmail("");
          setRole("");
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Något gick fel vid inskickning av formuläret');
    }
  }

  return (
    <div className='homeWrapper'>
      <div className='buttonWrapper-Layout'>
        <Button className='SigninButton-Layout' text="Sign In" onClick={handleOnHome} />
      </div>
      <form onSubmit={handleSubmit} className='formWrapper'>
        <div className='Logo-Layout'>
          <img src={Shape} alt='Shape' />
        </div>
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu registrerat en ny användare!</h3>
            <p>Kolla din e-post för bekräftelse.</p>
          </div>
        ) : (
          <>
            <div className='formGroup'>
              <label htmlFor='username'>Användarnamn:</label>
              <input
                type='text'
                id='username'
                placeholder='Skriv användarnamn...'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='password'>Lösenord:</label>
              <input
                type='password'
                id='password'
                placeholder='Skriv lösenord...'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='email'>Email:</label>
              <input
                type='email'
                id='email'
                placeholder='Skriv email...'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='role'>Roll:</label>
              <input
                type='text'
                id='role'
                placeholder='Skriv roll...'
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            <Button className='SendButton-Layout' text="Skicka in" type="submit" />
          </>
        )}
      </form>
    </div>
  );
}
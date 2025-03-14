import React, { useState } from 'react';
import '../index.css';
import Shape from '../assets/Shape.png';

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
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
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            To: email,
            Subject: "Bekräftelse på din registrering",
            Body: `
              <h2>Du har lagts till som Kundtjänstmedarbetare !</h2>
              <p>Dina uppgifter:</p>
              <ul>
                <li>Användarnamn: ${username}</li>
                <li>Lösenord: ${password}</li>
                <li>Roll: ${role}</li>
                <li>Email: ${email}</li>
              </ul>
              <p>Gå in på denna länken för att kunna byta lösenord.</p>
              <a href="${window.location.origin}/password" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white;">Byt lösenord</a>
            `
          })
        });

        if (emailResponse.ok) {
          setIsSubmitted(true);
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
      <form onSubmit={handleSubmit} className='formWrapper'>
        <div className='Logo-Layout'>
          <img src={Shape} alt='Shape' />
        </div>
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu registrerat en ny kundtjänstmedarbetare!</h3>
            <p>e-post har nu skickats till denna person.</p>
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
              <select
                id='role'
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value=''>Välj roll</option>
                <option value='SUPPORT'>Support</option>
              </select>
            </div>

            <button className='SendButton-Layout' type="submit">Skicka in</button>
          </>
        )}
      </form>
    </div>
  );
}
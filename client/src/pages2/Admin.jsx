import React, { useState } from 'react';
import Button from '../Components/button';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

export default function Admin() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [passworld, setPassworld] = useState("");
  const [role, setRole] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Ny state för bekräftelsemeddelande

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // Skicka formulärdata till backend
      const formResponse = await fetch('/api/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: userName,
          Email: email,
          Passworld: passworld,
          Role: role
        })
      });

      if (formResponse.ok) {
        // Om formuläret skickades, skicka bekräftelsemail
        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            To: email,
            Subject: "Bekräftelse på din förfrågan",
            Body: `
              <h2>Tack för din förfrågan!</h2>
              <p>Vi har mottagit ditt ärende och återkommer inom 24 timmar.</p>
              <p>Dina uppgifter:</p>
              <ul>
                <li>Användarnamn: ${userName}</li>
                <li>Roll: ${role}</li>
                <li>Lösenord: ${passworld}</li>
              </ul>
              <p>Vi kommer att kontakta dig på: ${email}</p>
            `
            // Ändra "vi kommer att kontakta dig på: ${email}" till chattoken länken
          })
        });

        if (emailResponse.ok) {
          setIsSubmitted(true);
          // Återställ formuläret
          setUserName("");
          setEmail("");
          setPassworld("");
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
       <dev className='admin-logo'>
        <PeopleAltIcon sx={{ fontSize: 90, }} />
        </dev>
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu skickat in ditt ärende!</h3>
            <p>Kolla din e-post för bekräftelse.</p>
          </div>
        ) : (
          <>
            <div className='formGroup'>
              <label htmlFor='userName'>Användarnamn:</label>
              <input
                type='text'
                id='userName'
                placeholder='Skriv användarnamn...'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='email'>Gmail:</label>
              <input
                type='email'
                id='email'
                placeholder='Skriv gmail...'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='passworld'>Lösenord:</label>
              <input
                type='password'
                id='passworld'
                placeholder='Skriv lösenord...'
                value={passworld}
                onChange={(e) => setPassworld(e.target.value)}
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
                <option value=''>välj roll</option>
                <option value='Admin'>Admin</option>
                <option value='Support'>Support</option>
              </select>
            </div>

            <Button className='SendButton-Layout' text="Skicka in" type="submit" />
          </>
        )}
      </form>
    </div>
  );
}


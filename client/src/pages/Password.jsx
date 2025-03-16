import { useState } from 'react';
import Button from '../Components/button';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';

export default function NewPassword() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewpassword] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Ny state för bekräftelsemeddelande

  async function handleSubmit(event) {
    event.preventDefault();

    // Skicka formulärdata till backend med rätt endpoint
    const response = await fetch('/api/Newpassword', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName: userName,
        email: email,
        password: password,
        newPassword: newPassword
      })
    });

    if (response.ok) {
      // Om lösenordet uppdaterades, skicka bekräftelsemail
      const emailResponse = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          To: email,
          Subject: "Bekräftelse på lösenordsändring",
          Body: `
            <h2>Ditt lösenord har ändrats!</h2>
            <p>Du har nu ändrat ditt lösenord.</p>
            
            <ul>
              <li>Användarnamn: ${userName}</li>
              <li>Lösenord: ${newPassword}</li>
            </ul>
          `
        })
      });

      if (emailResponse.ok) {
        setIsSubmitted(true);
        // Återställ formuläret
        setUserName("");
        setEmail("");
        setPassword("");
        setNewPassword("");
      } else {
        alert('Lösenordet ändrades men bekräftelsemail kunde inte skickas');
      }
    } else {
      try {
        const data = await response.json();
        // Visa det specifika felmeddelandet från servern
        alert(data.message || 'Något gick fel vid uppdatering av lösenord');
      } catch {
        alert('Något gick fel vid uppdatering av lösenord');
      }
    }
  }

  return (
    <div className='homeWrapper'>
      <form onSubmit={handleSubmit} className='formWrapper'>
        <div className='people-logo'>
          <PeopleAltIcon sx={{ fontSize: 90, }} />
        </div>
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu ändrat ditt lösenord!</h3>
            <p>Kolla din e-post för bekräftelse.</p>
          </div>
        ) : (
          <>
            <h2>Ändra lösenord</h2>
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
              <label htmlFor='password'>Nuvarande lösenord:</label>
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
              <label htmlFor='newPassword'> Nytt Lösenord:</label>
              <input
                type='password'
                id='newPassword'
                placeholder='Skriv lösenord...'
                value={newPassword}
                onChange={(e) => setNewpassword(e.target.value)}
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
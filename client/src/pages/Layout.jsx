import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '../Components/button';
import '../index.css'; // Importera index.css för att använda de uppdaterade stilarna
import Shape from '../assets/Shape.png'; // Lägg till denna import

export default function Layout() {
  const navigate = useNavigate();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // Ny state för bekräftelsemeddelande

  function handleOnHome() {
    navigate("/Home");
  }

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
          Company: company,
          Email: email,
          Subject: subject,
          Message: message
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
                <li>Företag: ${company}</li>
                <li>Ämne: ${subject}</li>
                <li>Meddelande: ${message}</li>
              </ul>
              <p>Vi kommer att kontakta dig på: ${email}</p>
            `
            // Ändra "vi kommer att kontakta dig på: ${email}" till chattoken länken
          })
        });

        if (emailResponse.ok) {
          setIsSubmitted(true);
          // Återställ formuläret
          setCompany("");
          setEmail("");
          setSubject("");
          setMessage("");
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
            <h3>Du har nu skickat in ditt ärende!</h3>
            <p>Kolla din e-post för bekräftelse.</p>
          </div>
        ) : (
          <>
            <div className='formGroup'>
              <label htmlFor='company'>Välj företag:</label>
              <select
                id='company'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              >
                <option value=''>Välj ett företag</option>
                <option value='Godisfabriken AB'>Godisfabriken AB</option>
                <option value='Sport AB'>Sport AB</option>
              </select>
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
              <label htmlFor='subject'>Ämne:</label>
              <input
                className='form-subject'
                id='subject'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className='formGroup'>
              <label htmlFor='message'>Meddelande:</label>
              <input
                className='form-medelande'
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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


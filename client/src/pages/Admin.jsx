import React, { useState, useEffect } from 'react';
import '../index.css';
import Shape from '../assets/Shape.png';

export default function Admin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SUPPORT"); // Sätt default till SUPPORT
  // ÄNDRING: Nya states för att hantera företagsval
  const [companyId, setCompanyId] = useState("");  // Ny state för företags-ID
  const [companies, setCompanies] = useState([]); // State för att lagra företag
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hämtar företag från databasen
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
          // Sätt default companyId till första företaget om det finns
          if (data.length > 0) {
            setCompanyId(data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    }

    fetchCompanies();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      // ÄNDRING: Lagt till CompanyId i JSON-data som skickas till servern
      const formResponse = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Password: password,
          Email: email,
          Role: role,
          CompanyId: parseInt(companyId) // ÄNDRING: Lägg till företags-ID
        })
      });

      if (formResponse.ok) {
        // ÄNDRING: Hitta företagsnamnet för e-postmeddelandet
        const company = companies.find(c => c.id === parseInt(companyId));
        const companyName = company ? company.name : "";

        const emailResponse = await fetch('/api/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            To: email,
            Subject: "Bekräftelse på din registrering",
            Body: `
              <h2>Du har lagts till som Kundtjänstmedarbetare!</h2>
              <p>Dina uppgifter:</p>
              <ul>
                <li>Användarnamn: ${username}</li>
                <li>Lösenord: ${password}</li>
                <li>Roll: ${role}</li>
                <li>Email: ${email}</li>
                <li>Företag: ${companyName}</li>
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
          setRole("SUPPORT"); // man får inte ändra roll och det blir support direkt
          // ÄNDRING: Återställ companyId till första företaget
          if (companies.length > 0) {
            setCompanyId(companies[0].id);
          } else {
            setCompanyId("");
          }
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
                <option value='SUPPORT'>Support</option>
              </select>
            </div>

            {/* ÄNDRING: Ny dropdown för företagsval */}
            <div className='formGroup'>
              <label htmlFor='company'>Företag:</label>
              <select
                id='company'
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value=''>Välj företag</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <button className='SendButton-Layout' type="submit">Skicka in</button>
          </>
        )}
      </form>
    </div>
  );
}
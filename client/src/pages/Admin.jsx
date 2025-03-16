// i denna admin.jsx filen så implementerar vi ett administratörsgränssnitt för att 
//  skapa nya supportanvändare. Komponenten hanterar formulärinmatning,den gär en API-anrop för att 
//  skapa användare och skicka bekräftelsemail, samt visar ett bekräftelsemeddelande efter lyckad registrering.
import { useState, useEffect } from 'react';
import '../index.css';
import Shape from '../assets/Shape.png';


export default function Admin() {
  // State-variabler för formulärets fält med useState-hook
  const [username, setUsername] = useState(""); // Lagrar användarnamn
  const [password, setPassword] = useState(""); // Lagrar lösenord
  const [email, setEmail] = useState(""); // Lagrar e-postadress
  const [role, setRole] = useState("SUPPORT"); // Lagrar användarroll, med SUPPORT som standardvärde
  
  // State-variabler för företagshantering
  const [companyId, setCompanyId] = useState("");  // Lagrar valt företags-ID
  const [companies, setCompanies] = useState([]); // Lagrar lista med alla företag
  const [isSubmitted, setIsSubmitted] = useState(false); // Håller reda på om formuläret har skickats in

  // useEffect-hook som körs när komponenten laddas
  useEffect(() => {
    // har en funktion där jag kan hämta företag från API
    async function fetchCompanies() {
      try {
        // anropas api för att hämta företag
        const response = await fetch('/api/companies');
        if (response.ok) {
          // Konverterar svaret till JSON
          const data = await response.json();
          // Uppdaterar companies med hämtad data
          setCompanies(data);
          // Sätter standardvärde på companyId till första företaget om det finns
          if (data.length > 0) {
            setCompanyId(data[0].id);
          }
        }
      } catch (error) {
        //  Visar fel i konsolen om företagen inte kunde hämtas
        console.error('Error fetching companies:', error);
      }
    }

    // Anropar funktionen för att hämta företagen
    fetchCompanies();
  }, []); // Tom array betyder att useEffect bara körs en gång när komponenten laddas

  // Funktion som hanterar formulärinskickning
  async function handleSubmit(event) {
    // Stoppar sidan från att ladda om när formuläret skickas in
    event.preventDefault();
    try {
      // Skickar formulärdata till API:et för att skapa en ny användare
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
          CompanyId: parseInt(companyId) // Konverterar companyId till ett heltal
        })
      });

      if (formResponse.ok) {
        // Hittar företagsnamnet för e-postmeddelandet
        const company = companies.find(c => c.id === parseInt(companyId));// Hittar företaget som matchar det valda ID:t
        const companyName = company ? company.name : "";// Hämtar företagsnamnet, annars tom text

        // Skickar e-post till den nya användaren
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

        // Om mailet skickades framgångsrikt
        if (emailResponse.ok) {
          
          setIsSubmitted(true); // Visar bekräftelsemeddelande istället för formuläret
         
          setUsername("");
          setPassword("");
          setEmail("");
          setRole("SUPPORT"); // Återställer roll till standardvärdet
          
          // Om det finns minst ett företag i listan
          if (companies.length > 0) {
            setCompanyId(companies[0].id); // Välj automatiskt det första företaget som standard
          } else {
            // så är det tom ruta
            setCompanyId("");
          }
        }
      }
    } catch (error) {
      // Hanterar eventuella fel vid inskickning
      console.error('Error:', error);
      alert('Något gick fel vid inskickning av formuläret');
    }
  }

  // Returnerar JSX för att rendera komponenten
  return (
    <div className='homeWrapper'>
      {/* här så anropar den handleSubmit-funktionen när det skickas in*/}
      <form onSubmit={handleSubmit} className='formWrapper'>
        <div className='Logo-Layout'>
          <img src={Shape} alt='Shape' />
        </div>
        {/* Villkorlig rendering: visar antingen bekräftelsemeddelande eller formulär */}
        {isSubmitted ? (
          <div className="success-message">
            <h3>Du har nu registrerat en ny kundtjänstmedarbetare!</h3>
            <p>e-post har nu skickats till denna person.</p>
          </div>
        ) : (
          <>
            {/* Formulärfält för användarnamn */}
            <div className='formGroup'>
              <label htmlFor='username'>Användarnamn:</label>
              <input
                type='text'
                id='username'
                placeholder='Skriv användarnamn...'
                value={username}
                // Uppdaterar username-variabeln automatiskt när användaren skriver i textfältet
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            {/* Formulärfält för lösenord */}
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

            {/* Formulärfält för e-post */}
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

            {/* Dropdown för användarroll (begränsad till Support) */}
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

            {/* Dropdown för företagsval */}
            <div className='formGroup'>
              <label htmlFor='company'>Företag:</label>
              <select
                id='company'
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
              >
                <option value=''>Välj företag</option>
                {/* Dynamiskt genererar alternativ baserat på hämtade företag */}
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
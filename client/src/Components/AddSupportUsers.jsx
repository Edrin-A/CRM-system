// Komponent för att lägga till nya kundtjänstmedarbetare
import { useState, useEffect } from 'react';
import Shape from '../assets/Shape.png';

export default function AddSupportUser({ goBackToMenu }) {
  // State-variabler för formulärets fält med useState-hook
  const [username, setUsername] = useState(""); // Lagrar användarnamn
  const [password, setPassword] = useState(""); // Lagrar lösenord
  const [email, setEmail] = useState(""); // Lagrar email
  const [role, setRole] = useState("SUPPORT"); // Lagrar användarroll med SUPPORT som standardvärde

  // State-variabler för företagshantering
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

    fetchCompanies();
  }, []);

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
        const company = companies.find(c => c.id === parseInt(companyId)); // Hittar företaget som matchar det valda ID:t
        const companyName = company ? company.name : ""; // Hämtar företagsnamnet, annars tom text

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
    <form onSubmit={handleSubmit} className='formWrapper'>
      <div className='Logo-Layout'>
        <img src={Shape} alt='Shape' />
      </div>

      {/* Tillbaka-knapp */}
      <button type="button" className="BackButton-Layout" onClick={goBackToMenu}>
        Tillbaka till menyn
      </button>

      <h2>Lägg till ny kundtjänstmedarbetare</h2>

      {/* Bekräftelsemeddelande eller formulär */}
      {isSubmitted ? (
        <div className="success-message">
          <h3>Du har nu registrerat en ny kundtjänstmedarbetare!</h3>
          <p>E-post har nu skickats till denna person.</p>
          <button type="button" className="BackButton-Layout" onClick={goBackToMenu}>
            Tillbaka till menyn
          </button>
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
  );
}

// Komponent för att hantera befintliga kundtjänstmedarbetare
import { useState, useEffect } from 'react';
import Shape from '../assets/Shape.png';

export default function ManageSupportUsers({ goBackToMenu }) {
  const [supportUsers, setSupportUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [companies, setCompanies] = useState([]);

  // Nytt state för att spara admin-användarens företags-ID
  const [adminCompanyId, setAdminCompanyId] = useState(null);

  // Formulärvärden för redigering
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");

  // Hämta företag och supportanvändare när komponenten laddas
  useEffect(() => {
    async function fetchData() {
      try {
        // Hämta admin-användarens företags-ID först
        const userResponse = await fetch('/api/login');
        if (userResponse.ok) {
          const userData = await userResponse.json();

          // Hämta admin-användarens företags-ID
          const userDetailsResponse = await fetch('/api/users/' + userData.id);
          if (userDetailsResponse.ok) {
            const userDetails = await userDetailsResponse.json();
            setAdminCompanyId(userDetails.company_id);

            // Sätt companyId för redigering till admin-användarens företags-ID
            setCompanyId(userDetails.company_id.toString());
          }
        }

        // Hämta bara admin-användarens företag
        const companiesResponse = await fetch('/api/companies');
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          // Filtrera för att bara visa admin-användarens företag
          const adminCompany = companiesData.filter(c => c.id === adminCompanyId);
          setCompanies(adminCompany);
        }

        // Hämta supportanvändare för admin-användarens företag
        // Detta bör filtreras på servern men vi lägger till ett filter här också
        const usersResponse = await fetch('/api/support-users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          // Filtrera för att bara visa supportanvändare från admin-användarens företag
          const filteredUsers = usersData.filter(user => user.company_id === adminCompanyId);
          setSupportUsers(filteredUsers);
        } else {
          setError('Kunde inte hämta kundtjänstmedarbetare');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Ett fel uppstod vid hämtning av data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [adminCompanyId]);

  // Funktion för att starta redigering av användare
  const handleEdit = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setCompanyId(user.company_id.toString());
  };

  // Funktion för att avbryta redigering
  const handleCancelEdit = () => {
    setEditingUser(null);
    setUsername("");
    setEmail("");
    setCompanyId("");
  };

  // Funktion för att spara ändringar
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/support-users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Username: username,
          Email: email,
          CompanyId: adminCompanyId  // Använd alltid admin-användarens företags-ID
        })
      });

      if (response.ok) {
        // Uppdatera listan med användare
        const updatedUser = await response.json();
        setSupportUsers(supportUsers.map(user =>
          user.id === editingUser.id ? updatedUser : user
        ));

        // Återställ formulär
        handleCancelEdit();
      } else {
        alert('Kunde inte uppdatera användaren');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Ett fel uppstod vid uppdatering av användaren');
    }
  };

  // Funktion för att ta bort användare
  const handleDelete = async (userId) => {
    if (window.confirm('Är du säker på att du vill ta bort denna kundtjänstmedarbetare?')) {
      try {
        const response = await fetch(`/api/support-users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          // Ta bort användaren från listan
          setSupportUsers(supportUsers.filter(user => user.id !== userId));
        } else {
          alert('Kunde inte ta bort användaren');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Ett fel uppstod vid borttagning av användaren');
      }
    }
  };

  // Hitta företagsnamn baserat på admin-användarens företags-ID
  const getCompanyName = () => {
    const company = companies.find(c => c.id === adminCompanyId);
    return company ? company.name : 'Okänt företag';
  };

  return (
    <div className='formWrapper'>
      <div className='Logo-Layout'>
        <img src={Shape} alt='Shape' />
      </div>

      <div className="centered-button-container">
        <button type="button" className="BackButton-Centered" onClick={goBackToMenu}>
          Tillbaka till menyn
        </button>
      </div>

      <h2>Hantera kundtjänstmedarbetare för {getCompanyName()}</h2>

      {loading ? (
        <p>Laddar kundtjänstmedarbetare...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {/* Redigeringsformulär */}
          {editingUser && (
            <div className="edit-form">
              <h3>Redigera kundtjänstmedarbetare</h3>

              <div className='formGroup'>
                <label htmlFor='editUsername'>Användarnamn:</label>
                <input
                  type='text'
                  id='editUsername'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className='formGroup'>
                <label htmlFor='editEmail'>Email:</label>
                <input
                  type='email'
                  id='editEmail'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Ta bort företagsväljare eftersom admin bara kan använda sitt eget företag */}
              <p>Företag: {getCompanyName()}</p>

              <div className="button-group">
                <button type="button" className="SaveButton-Layout" onClick={handleSaveEdit}>
                  Spara
                </button>
                <button type="button" className="CancelButton-Layout" onClick={handleCancelEdit}>
                  Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Lista med kundtjänstmedarbetare */}
          <div className="users-list">
            <h3>Kundtjänstmedarbetare</h3>

            {supportUsers.length === 0 ? (
              <p>Inga kundtjänstmedarbetare hittades.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Användarnamn</th>
                    <th>Email</th>
                    <th>Företag</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {supportUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{getCompanyName()}</td>
                      <td>
                        <button
                          type="button"
                          className="EditButton-Table"
                          onClick={() => handleEdit(user)}
                        >
                          Redigera
                        </button>
                        <button
                          type="button"
                          className="DeleteButton-Table"
                          onClick={() => handleDelete(user.id)}
                        >
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

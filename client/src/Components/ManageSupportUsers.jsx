// Komponent för att hantera befintliga kundtjänstmedarbetare
import { useState, useEffect } from 'react';
import Shape from '../assets/Shape.png';

export default function ManageSupportUsers({ goBackToMenu }) {
  const [supportUsers, setSupportUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState([]);

  // Formulärvärden för redigering
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState("");

  // Hämta företag och supportanvändare när komponenten laddas
  useEffect(() => {
    async function fetchData() {
      try {
        // Hämta företag
        const companiesResponse = await fetch('/api/companies');
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData);
        }

        // Hämta supportanvändare
        const usersResponse = await fetch('/api/support-users');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setSupportUsers(usersData);
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
  }, []);

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
          CompanyId: parseInt(companyId)
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

  // Funktion för att filtrera användare baserat på företag
  const filteredUsers = selectedCompanyId
    ? supportUsers.filter(user => user.company_id.toString() === selectedCompanyId)
    : supportUsers;

  // Hitta företagsnamn baserat på ID
  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Okänt företag';
  };

  return (
    <div className='formWrapper'>
      <div className='Logo-Layout'>
        <img src={Shape} alt='Shape' />
      </div>

      <button type="button" className="BackButton-Layout" onClick={goBackToMenu}>
        Tillbaka till menyn
      </button>

      <h2>Hantera kundtjänstmedarbetare</h2>

      {/* Filter för företag */}
      <div className='formGroup'>
        <label htmlFor='companyFilter'>Filtrera på företag:</label>
        <select
          id='companyFilter'
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
        >
          <option value="">Alla företag</option>
          {companies.map(company => (
            <option key={company.id} value={company.id.toString()}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Laddar kundtjänstmedarbetare...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          {/* Redigeringsformulär (visas endast när en användare redigeras) */}
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

              <div className='formGroup'>
                <label htmlFor='editCompany'>Företag:</label>
                <select
                  id='editCompany'
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                >
                  {companies.map(company => (
                    <option key={company.id} value={company.id.toString()}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

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

            {filteredUsers.length === 0 ? (
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
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{getCompanyName(user.company_id)}</td>
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

import { createContext, useEffect, useState } from "react";

// Skapar en global kontext för att hantera användarstatus och autentisering genom hela applikationen
const GlobalContext = createContext();

function GlobalProvider({ children }) {
  // Lagrar användarinformation för att kunna avgöra behörigheter och anpassa UI
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  /**
   * Hämtar användarens inloggningsstatus från servern
   * Används vid applikationsstart och efter inloggning för att säkerställa 
   * att användarinformationen är uppdaterad
   */
  async function getLogin() {
    const response = await fetch('/api/login', { credentials: 'include' });
    const data = await response.json();
    console.log(data);
    if (response.ok) {
      setUser(data);
    } else {
      // Återställer användarstatus om ingen är inloggad eller om sessionen har upphört
      setUser(null);
      console.log("Error getting session data");
    }
  }

  // Logga in användare
  async function login(username, password) {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);  // Sätt användaren direkt från svaret
        return { success: true };
      } else {
        return {
          success: false,
          message: "Felaktigt användarnamn eller lösenord, eller så har du inte behörighet att logga in"
        };
      }
    } catch (error) {
      console.error("Fel vid inloggning:", error);
      return { success: false, message: "Ett fel uppstod vid inloggning" };
    }
  }

  // Logga ut användare
  async function logout() {
    try {
      const response = await fetch('/api/login', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, message: error.message || "Utloggning misslyckades" };
      }
    } catch (error) {
      console.error("Fel vid utloggning:", error);
      return { success: false, message: "Ett fel uppstod vid utloggning" };
    }
  }

  // Hämta ärenden för support/admin
  async function fetchTickets() {
    try {
      const response = await fetch('/api/tickets', {
        credentials: 'include'  // Viktigt för att skicka med cookies
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched tickets:', data);  // Lägg till denna rad för debugging
        setTickets(data);
      } else {
        console.error('Failed to fetch tickets:', await response.text());
      }
    } catch (error) {
      console.error("Fel vid hämtning av ärenden:", error);
    }
  }

  // Kontrollera om användaren har en specifik roll
  function hasRole(requiredRole) {
    return user && user.role === requiredRole;
  }

  // Kontrollerar användarstatus när applikationen laddas
  // Detta säkerställer att användare förblir inloggade vid siduppdateringar
  useEffect(() => {
    getLogin();
  }, []);

  // Hämta ärenden när användaren ändras
  useEffect(() => {
    if (user && (user.role === 'SUPPORT' || user.role === 'ADMIN')) {
      fetchTickets();
    }
  }, [user]);

  return (
    <GlobalContext.Provider value={{
      user,
      loading,
      tickets,
      getLogin,
      login,
      logout,
      fetchTickets,
      hasRole,
      // Förberäknade egenskaper för att förenkla rollbaserad åtkomstkontroll i komponenter
      isAuthenticated: !!user,
      isSupport: user?.role === 'SUPPORT',
      isAdmin: user?.role === 'ADMIN',
      isUser: user?.role === 'USER'
    }}>
      {children}
    </GlobalContext.Provider>
  );
}

export { GlobalContext, GlobalProvider };
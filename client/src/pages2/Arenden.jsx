import { useContext, useEffect } from 'react';
import Dashboard from '../Components/Dashboard';
import Navbar from '../Components/Navbar';
import { GlobalContext } from '../GlobalContext';
import '../index.css'; // Importera den nya CSS-filen

export default function Arenden() {
  const { tickets, fetchTickets } = useContext(GlobalContext);

  // denna useEffect övervakar tickets och uppdaterar varje gång den ändras
  useEffect(() => {
    console.log('Tickets:', tickets);  // detta hjälper oss att se om data hämtas
  }, [tickets]);

  // Denna useEffect körs endast en gång när komponenten monteras (tom beroendelista [])
  // Hämtar ärendedata direkt när sidan laddas
  useEffect(() => {
    fetchTickets();
  }, []);

  // Funktion för att uppdatera status på ett ärende
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Uppdatera listan med ärenden
        fetchTickets();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="navbar-spacer"></div>
      <div className="page-container">
        <Dashboard />
        <main className="main-content">
          <h1 className="page-title">Ärenden</h1>
          <div className="tickets-container">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="ticket-item"
              >
                <p className="ticket-field">{ticket.company_name}</p>
                <p className="ticket-field">{ticket.customer_email}</p>
                <p className="ticket-field">{ticket.subject}</p>
                <div className="ticket-field">
                  <a
                    href={`/chat/${ticket.chat_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chat-link"
                  >
                    Öppna chatt
                  </a>
                </div>
                <div className="ticket-field select-container">
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="NY">NY</option>
                    <option value="PÅGÅENDE">PÅGÅENDE</option>
                    <option value="LÖST">LÖST</option>
                    <option value="STÄNGD">STÄNGD</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
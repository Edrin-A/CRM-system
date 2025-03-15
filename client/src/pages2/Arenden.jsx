import React, { useContext, useEffect } from 'react';
import Dashboard from '../Components/Dashboard';
import Box from '@mui/material/Box';  // Importera Box från MUI
import Typography from '@mui/material/Typography';  // Importera Typography från MUI
import Navbar from '../Components/Navbar';
import { GlobalContext } from '../GlobalContext';
import { FormControl, Select, MenuItem } from '@mui/material';

export default function Arenden() {
  const { tickets, fetchTickets } = useContext(GlobalContext);

  //  denna useEffect för att se vad som händer
  useEffect(() => {
    console.log('Tickets:', tickets);  // Detta hjälper oss att se om data hämtas
  }, [tickets]);

  // denna useEffect för att säkerställa att tickets hämtas
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
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Dashboard />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>Ärenden</Typography>
          <Box>
            {tickets.map((ticket) => (
              <Box
                key={ticket.id}
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body1" sx={{ flex: 1 }}>{ticket.company_name}</Typography>
                <Typography variant="body1" sx={{ flex: 1 }}>{ticket.customer_email}</Typography>
                <Typography variant="body1" sx={{ flex: 1 }}>{ticket.subject}</Typography>
                <Box sx={{ flex: 1 }}>
                  <a
                    href={`/chat/${ticket.chat_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Öppna chatt
                  </a>
                </Box>
                <FormControl sx={{ flex: 1, minWidth: 120 }}>
                  <Select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="NY">NY</MenuItem>
                    <MenuItem value="PÅGÅENDE">PÅGÅENDE</MenuItem>
                    <MenuItem value="LÖST">LÖST</MenuItem>
                    <MenuItem value="STÄNGD">STÄNGD</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}
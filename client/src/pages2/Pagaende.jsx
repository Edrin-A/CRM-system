import React from 'react';
import Dashboard from '../Components/Dashboard';
import Box from '@mui/material/Box';  // Importera Box från MUI
import Typography from '@mui/material/Typography';  // Importera Typography från MUI
import Navbar from '../Components/Navbar';

const users = [
  { company: 'Apple AB', email: 'user1@apple.com', amne: 'Ämne 1', url: 'https://apple.com' },
  { company: 'Tesla AB', email: 'user2@tesla.com', amne: 'Ämne 2', url: 'https://tesla.com' },
  { company: 'Microsoft AB', email: 'user3@microsoft.com', amne: 'Ämne 3', url: 'https://microsoft.com' },
  { company: 'Google AB', email: 'user4@google.com', amne: 'Ämne 4', url: 'https://google.com' },
  { company: 'Facebook AB', email: 'user5@facebook.com', amne: 'Ämne 5', url: 'https://facebook.com' },
  { company: 'Twitter AB', email: 'user6@tvwitter.com ', amne: 'Ämne 6', url: 'https://twitter.com' },
  { company: 'Amazon AB', email: 'user7@jeffan.com', amne: 'Ämne 7', url: 'https://amazon.com' },
  // Lägg till fler användare här
];

export default function Pagaende() {
  return (
    <>
      <Navbar />
      <Box height={70} />
      <Box sx={{ display: 'flex' }}>
        <Dashboard />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Box>
            {users.map((user, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <Typography variant="h6">{user.company}</Typography>
                <Typography variant="body1">{user.email}</Typography>
                <Typography variant="body1">{user.amne}</Typography>
                <Typography variant="body1"> <a href={user.url} target="_blank" rel="noopener noreferrer">{user.url}</a> </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}

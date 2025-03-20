//analysl sidan är lik tabell sidan där vi har skapat och visar en graf och en tabell med företagsinformation.
// och importerat samma komponenter som i tabell sidan.
import React, { useState, useEffect } from 'react';
import Dashboard from '../Components/Dashboard';
import Navbar from '../Components/Navbar';  // Importera Navbar-komponenten 
import Box from '@mui/material/Box';  // Importera Box från MUI
import Typography from '@mui/material/Typography';  // Importera Typography från MUI
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import AccessibilityIcon from '@mui/icons-material/Accessibility';
import "../Dash.css"; // Importera Dash.css
import BarChart from '../Charts/BarChart';
import PieChart from '../Charts/PieChart';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';


export default function Analys() {
  // State för att lagra statistik från backend
  // Vi använder ett objekt med tre statistikvärden som hämtas från API:et
  const [stats, setStats] = useState({
    totalCustomers: 0,  // Totalt antal kunder i databasen
    customersToday: 0,  // Antal kunder som registrerat sig idag
    activeNow: 0        // Antal aktiva användare senaste timmen
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hämta data från backend när komponenten laddas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Gör API-anrop till vår backend endpoint för dashboard-statistik
        const response = await axios.get('/api/statistics/dashboard');
        
        // Uppdatera state med datan från API-svaret
        // || 0 säkerställer att vi aldrig får null/undefined-värden
        setStats({
          totalCustomers: response.data.totalCustomers || 0,
          customersToday: response.data.customersToday || 0,
          activeNow: response.data.activeNow || 0
        });
        setLoading(false);
      } catch (err) {
        console.error("Fel vid hämtning av statistik:", err);
        setError("Kunde inte hämta statistik");
        setLoading(false);
      }
    };

    fetchStats();
    
    // Tomt beroende-array betyder att detta körs endast en gång när komponenten laddas
  }, []);

  return (
    <>
    <div className='background-hela-sidan'>
     <Navbar />    
      <Box height={70}/>
    <Box sx={{ display: 'flex' }}>
      <Dashboard />
   <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
       <Grid container spacing={2}>
            <Grid item xs={8}>
              <Stack spacing={2} direction="row" > 
                {/* delat upp med card (container) för varje kort*/}
                <Card sx={{ minWidth: 345, height: 15 + 'vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      {/* Visa laddningsindikator eller data när den är färdigladdad */}
                      {loading ? <CircularProgress size={24} color="inherit" /> : stats.totalCustomers.toLocaleString()}
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Total antal kunder
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card sx={{ minWidth: 345, height: 15 + 'vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : stats.customersToday.toLocaleString()}
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Antal kunder idag
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ minWidth: 345, height: 15 + 'vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      {loading ? <CircularProgress size={24} color="inherit" /> : stats.activeNow.toLocaleString()}
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Aktiva nu
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              
            </Grid>
          </Grid>
          <Box height={20}/>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Card sx={{ height: 60 + 'vh' }}>           
                <CardContent>
                  <BarChart />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ maxWidth: 345 }} className='card'>  
                <CardContent>
                  <PieChart />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
      </Box>
    </Box>
  </div>
    </>
  )
}

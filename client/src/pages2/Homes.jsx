// homes.jsx är som huvuddashboarden Visar tre informationskort med statistik och
//Visar företagstabellen i ett stort kort som fyller nedre delen av sidan
// Importerar nödvändiga Material UI-komponenter för att bygga en stilren tabell
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
import Tabell from '../Components/Tabell'; // Importera Tabell-komponenten
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export default function Homes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State för att lagra statistik från backend
  // Vi använder ett objekt med tre statistikvärden som hämtas från API:et
  const [stats, setStats] = useState({
    totalCustomers: 0, 
    customersToday: 0,
    activeNow: 0       
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hämta data från backend när komponenten laddas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Använd samma endpoint som i Analys.jsx
        const response = await axios.get('/api/statistics/dashboard');
        
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
  }, []);

  return (
    <>
      <div className='background-hela-sidan'>
        <Navbar />    
        <Box height={70}/>
        {/* Skapar en flexbox-container för sidlayout*/}
        <Box sx={{ display: 'flex' }}>
          <Dashboard />
           {/* Huvudinnehållsområde som växer för att fylla tillgängligt utrymme */}
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack 
                  spacing={isMobile ? 2 : 2} 
                  direction={isMobile ? "column" : "row"} 
                  justifyContent="space-between"
                  sx={{ mb: 2 }}> 
                  <Card sx={{width: isMobile ? "100%" : "31%", height: 15 + 'vh'}} className="gradient-card">           
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
                  <Card 
                    sx={{width: isMobile ? "100%" : "31%", height: 15 + 'vh'}} className="gradient-card">           
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
                  <Card 
                    sx={{  width: isMobile ? "100%" : "31%", height: 15 + 'vh' }}  className="gradient-card">           
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
            </Grid>
            
            <Box height={20}/>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ height: 'calc(75vh - 20px)' }}>           
                  <CardContent>
                    <Tabell />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </div>
    </>
  );
}

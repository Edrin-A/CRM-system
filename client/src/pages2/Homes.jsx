// homes.jsx är som huvuddashboarden Visar tre informationskort med statistik och
//Visar företagstabellen i ett stort kort som fyller nedre delen av sidan
import React from 'react';
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

export default function Homes() {
  return (
    <>
      <div className='background-hela-sidan'>
        <Navbar />    
        <Box height={70}/>
        <Box sx={{ display: 'flex' }}>
          <Dashboard />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                {/* delat upp med card (container) för varje kort*/}
                <Card sx={{ height: '15vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      2,420
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Total antal kunder
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '15vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      1,210
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Antal kunder idag
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '15vh' }} className="gradient-card">           
                  <CardContent>
                    <div className='icon'>
                      <AccessibilityIcon />
                    </div>
                    <Typography gutterBottom variant="h5" component="div" sx={{ color: "white" }}>
                      316
                    </Typography>
                    <Typography gutterBottom variant="body2" component="div" sx={{ color: "#ccd1d1" }}>
                      Aktiva nu
                    </Typography>
                  </CardContent>
                </Card>
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

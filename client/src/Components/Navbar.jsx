import { useContext } from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import "../Dash.css"; // Importera CSS-filen
import { GlobalContext } from '../GlobalContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { logout, user } = useContext(GlobalContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    } else {
      alert(result.message || 'Utloggning misslyckades');
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ backgroundColor: "white", color: "black" }}>
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="open drawer">
            <MenuIcon /> {/* Menyikon */}
          </IconButton>
          <Box sx={{ flexGrow: 1 }} /> {/* Flexbox för att skjuta CRM-titeln till höger */}
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
            CRM {/* Titel */}
          </Typography>

          {/* Utloggningsknapp */}
          <IconButton
            size="large"
            color="inherit"
            onClick={handleLogout}
            sx={{
              ml: 2,
              display: user ? 'flex' : 'none'
            }}
          >
            <Typography variant="button" sx={{ fontSize: '0.875rem' }}>
              Logga ut
            </Typography>
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

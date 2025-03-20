import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MessageIcon from '@mui/icons-material/Message';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockIcon from '@mui/icons-material/Lock';
import Navbar from './Navbar';


// Konstanter
const drawerWidth = 240;

// Mixins för drawer-stilar
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

// Styled-komponenter
const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // för att få innehållet att vara nedanför app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

// Stilar för menyalternativ
const getItemButtonStyle = (open) => [
  {
    minHeight: 48,
    px: 2.5,
  },
  open
    ? { justifyContent: 'initial' }
    : { justifyContent: 'center' },
];

const getItemIconStyle = (open) => [
  {
    minWidth: 0,
    justifyContent: 'center',
  },
  open
    ? { mr: 3 }
    : { mr: 'auto' },
];

const getItemTextStyle = (open) => [
  open
    ? { opacity: 1 }
    : { opacity: 0 },
];

// Menyalternativ
const getMenuItems = (navigate) => [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/homes' },
  { text: 'Ärenden', icon: <AssignmentIcon />, path: '/arenden' },
  { text: 'Analys', icon: <AnalyticsIcon />, path: '/analys' },
];

// Komponent för ett menyalternativ
const MenuItem = ({ text, icon, path, open, navigate }) => (
  <ListItem disablePadding sx={{ display: 'block' }} onClick={() => navigate(path)}>
    <ListItemButton sx={getItemButtonStyle(open)}>
      <ListItemIcon sx={getItemIconStyle(open)}>
        {icon}
      </ListItemIcon>
      <ListItemText primary={text} sx={getItemTextStyle(open)} />
    </ListItemButton>
  </ListItem>
);

export default function Dashboard() {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const menuItems = getMenuItems(navigate);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Box height={30} />
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(!open)}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />

        <List>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              text={item.text}
              icon={item.icon}
              path={item.path}
              open={open}
              navigate={navigate}
            />
          ))}
        </List>

        <Divider />

        <List sx={{ marginTop: 'auto' }}>
          <MenuItem
            text="Admin"
            icon={<AdminPanelSettingsIcon />}
            path="/admin"
            open={open}
            navigate={navigate}
          />
        </List>

        <List>
          <MenuItem
            text="Ändra lösenord"
            icon={<LockIcon />}
            path="/Password"
            open={open}
            navigate={navigate}
          />
        </List>
      </Drawer>
    </Box>
  );
}

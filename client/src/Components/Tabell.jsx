//Tabell.jsx är en React-komponent som skapar och visar en tabell med företagsinformation. Komponenten:
// Importerar nödvändiga Material UI-komponenter för att bygga en stilren tabell
import * as React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// Skapar en array med exempeldata för företag som ska visas i tabellen
const rows = [
  { id: 1, name: 'Godisfabriken AB', active: 'Yes', industry: 'Godis' },
  { id: 2, name: 'Sport AB', active: 'Yes', industry: 'Sport' },
  { id: 3, name: 'Company C', active: 'Yes', industry: 'Healthcare' },
  { id: 4, name: 'Company D', active: 'No', industry: 'Retail' },
  { id: 5, name: 'Company E', active: 'Yes', industry: 'Education' },
];

// Definierar och exporterar huvudkomponenten SimpleTable
export default function SimpleTable() {
  return (
    // Box-komponenten fungerar som en container med styling (width: 100%, margin-top: 3)
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* Typography-komponenten visar rubriken "Företag" med styling (margin-bottom: 2) */}
      <Typography variant="h5" component="div" sx={{ mb: 2 }}>
        Företag
      </Typography>
      {/* TableContainer omsluter tabellen och ger den en pappersliknande bakgrund */}
      <TableContainer component={Paper}>
        {/* Table-komponenten definierar själva tabellen med minsta bredd 650px */}
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          {/* TableHead innehåller tabellens rubrikrad */}
          <TableHead>
            <TableRow>
              {/* TableCell-komponenter definierar kolumnrubrikerna */}
              <TableCell>Namn</TableCell>
              <TableCell align="right">Aktiv</TableCell>
              <TableCell align="right">Bransch</TableCell>
            </TableRow>
          </TableHead>
          {/* TableBody innehåller tabellens datarader */}
          <TableBody>
            {/* Använder map-funktionen för att skapa en TableRow för varje företag i rows-arrayen */}
            {rows.map((row) => (
              <TableRow key={row.id}>
                {/* TableCell-komponenter visar data för varje kolumn */}
                <TableCell component="th" scope="row"> {row.name} </TableCell>
                <TableCell align="right">{row.active}</TableCell>
                <TableCell align="right">{row.industry}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
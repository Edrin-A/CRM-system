import React from 'react'
import Navbar from '../Components/Navbar'
import Dashboard from '../Components/Dashboard'
import { Box } from '@mui/material'

const Kontakt = () => {
  return (
    <>
     <Navbar />    
      <Box height={30}/>
    <Box sx={{ display: 'flex' }}>
      <Dashboard />
       <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <h1>Kontakt</h1> 
      </Box>
      </Box>
      </>
  )
}

export default Kontakt

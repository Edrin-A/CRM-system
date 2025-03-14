import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { GlobalContext } from '../GlobalContext';

export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin } = useContext(GlobalContext);

  // Om användaren inte är inloggad, omdirigera till inloggningssidan
  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Om användaren är inloggad men inte är admin, omdirigera till homes
  if (!isAdmin) {
    return <Navigate to="/homes" />;
  }

  // Om användaren är inloggad och är admin, visa den skyddade komponenten
  return children;
} 
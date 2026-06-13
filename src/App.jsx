import React from "react";
import Routes from './Routes';
import { AuthProvider } from './contexts/AuthContext';
import { LocalModeProvider } from './contexts/LocalModeContext';

function App() {
  return (
    <AuthProvider>
      <LocalModeProvider>
        <Routes />
      </LocalModeProvider>
    </AuthProvider>
  );
}

export default App;
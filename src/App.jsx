import React from "react";
import Routes from './Routes';
import { AuthProvider } from './contexts/AuthContext';
import { LocalModeProvider } from './contexts/LocalModeContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocalModeProvider>
          <Routes />
        </LocalModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
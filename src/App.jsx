import React from "react";
import Routes from './Routes';
import { AuthProvider } from './contexts/AuthContext';
import { LocalModeProvider } from './contexts/LocalModeContext';
import { ThemeProvider, ThemeToggle } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocalModeProvider>
          <ThemeToggle />
          <Routes />
        </LocalModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
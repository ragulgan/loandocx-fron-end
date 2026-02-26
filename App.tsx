
import React from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import AppContent from './routes/routes';


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;

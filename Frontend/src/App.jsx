import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './pages/Dashboard';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    if (!isLoggedIn) {
        return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
    }

    return <Dashboard onLogout={() => setIsLoggedIn(false)} />;
}

export default App;

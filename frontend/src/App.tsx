import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Home from './Pages/Home';
import Insights from './Pages/Insights';
import Preferences from './Pages/Preferences';
import './App.css';
import MyNavBar from './Components/MyNavBar';
import Login from './Pages/Login/Login';
import Upload from './Pages/Upload';

function App() {
  const { isLoading, error } = useAuth0();

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router
      basename={process.env.NODE_ENV === 'production' ? '/finance-app' : ''}
    >
      <MyNavBar />
      <div className="main">
        <Routes>
          <Route path="/upload" element={<Upload />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { GetTokenSilentlyOptions, useAuth0 } from "@auth0/auth0-react";
import Home from './Pages/Home';
import Insights from './Pages/Insights';
import Preferences from './Pages/Preferences';
import './App.css';
import MyNavBar from './Components/MyNavBar';
import { getConfig } from "./config";
import Login from "./Pages/Login/Login";

const useAuth0AccessToken = (
  isAuthenticated: boolean, 
  getToken: (option: GetTokenSilentlyOptions) => Promise<string>) => {
  const [accessToken, setToken] = useState<string>("");
  useEffect(() => {
      const fetchAuth0Token = async () => {
          const config = getConfig();
          try {
              const token = await getToken({
                authorizationParams: {
                  audience: config.audience,
                },
              });
              setToken(token);
          } catch (e) {
              // Handle errors such as `login_required` and `consent_required` by re-prompting for a login
              console.error(e);
          }
      }
      if (isAuthenticated){
          fetchAuth0Token();
      }
  }, [getToken, isAuthenticated]);
  
  return accessToken;
}

function App() {
  const { 
    isLoading, 
    error,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  const accessToken = useAuth0AccessToken(isAuthenticated, getAccessTokenSilently);

  const authProps = {
    isAuthenticated,
    accessToken
  }

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router basename={process.env.NODE_ENV === 'production' ? '/finance-app': ''}>
      <div>
        <nav>
          <MyNavBar />
        </nav>
        <Routes>
          <Route path="/insights" element={<Insights {...authProps} />} />
          <Route path="/preferences" element={<Preferences {...authProps} />} />
          <Route path="/" element={<Home {...authProps} />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
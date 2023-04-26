import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { GetTokenSilentlyOptions, LogoutOptions, User, useAuth0 } from "@auth0/auth0-react";
import Home from './Pages/Home';
import Insights from './Pages/Insights';
import Preferences from './Pages/Preferences';
import './App.css';
import MyNavBar from './Components/MyNavBar';
import { getConfig } from "./config";
import Login from "./Pages/Login/Login";
import { AuthContext } from "./AuthContext";

interface AppAuth {
  cached: boolean;
  user: User;
  isLoading: boolean;
  error: Error;
  isAuthenticated: boolean;
  getAccessTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>;
  loginWithRedirect: (options?: any) => Promise<void>;
  logout: (options?: LogoutOptions) => void;
}

const useLocalCachedAuth0 = (): AppAuth => {
  const { 
    user,
    isLoading,
    error,
    isAuthenticated,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();

  // try get local cached username
  const localData = JSON.parse(localStorage.getItem("FINANCE_APP_DATA") ?? "{}");
  const localUser = localData.user;
  const localAuth = localData.accessToken;
  
  if (!isAuthenticated && !isLoading && !error && localUser && localAuth) {
    console.log("using local cached auth");
    return {
      cached: true,
      user: JSON.parse(localUser),
      isLoading: false,
      error: null,
      isAuthenticated: true,
      getAccessTokenSilently: () => Promise.resolve(localAuth),
      loginWithRedirect: () => Promise.resolve(),
      logout: (options) => {
        localStorage.removeItem("FINANCE_APP_DATA");
        window.location.replace(options.logoutParams.returnTo ?? window.location.origin)
        return Promise.resolve();
      }
    }
  }
  return {
    cached: false,
    user,
    isLoading,
    error,
    isAuthenticated,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  }
}

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
    cached,
    user,
    isLoading,
    error,
    isAuthenticated,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useLocalCachedAuth0();

  const accessToken = useAuth0AccessToken(isAuthenticated, getAccessTokenSilently);

  if (!cached && isAuthenticated) {
    localStorage.setItem("FINANCE_APP_DATA", JSON.stringify({
      user: JSON.stringify(user),
      accessToken,
    }));
  }

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      error,
      isAuthenticated,
      accessToken,
      loginWithRedirect,
      logout,
    }}>
      <Router basename={process.env.NODE_ENV === 'production' ? '/finance-app': ''}>
        <div>
          <nav>
            <MyNavBar />
          </nav>
          <Routes>
            <Route path="/insights" element={<Insights />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;

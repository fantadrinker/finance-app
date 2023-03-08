import logo from './logo.svg';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Upload } from './Pages/upload';
import { Activities } from './Pages/activities';
import { Home } from './Pages/home';
import './App.css';
import { Categories } from './Components/categories';
import LoginButton from './Components/LoginAuth0';
import NavBar from './Components/NavBar';

function App() {
  const { isLoading, error } = useAuth0();

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div>
        <nav>
          <NavBar />
        </nav>
        <Routes>
          <Route path="/categories/:userId" element={<Categories />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/activities/:userId" element={<Activities />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

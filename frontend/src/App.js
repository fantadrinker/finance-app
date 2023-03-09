import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Upload } from './Pages/upload';
import { Activities } from './Pages/activities';
import { Home } from './Pages/home';
import './App.css';
import { Categories } from './Components/categories';
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
    <Router basename={process.env.NODE_ENV === 'production' ? '/finance-app': ''}>
      <div>
        <nav>
          <NavBar />
        </nav>
        <Routes>
          <Route path="/categories/:userId" element={<Categories />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/activities/:userId" element={<Activities />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

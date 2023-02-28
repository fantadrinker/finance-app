import logo from './logo.svg';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { Upload } from './Pages/upload';
import { Activities } from './Pages/activities';
import { Home } from './Pages/home';
import './App.css';
import { Categories } from './Components/categories';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>
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

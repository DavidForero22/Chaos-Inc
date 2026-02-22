import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Lobby } from './components/Lobby';
import MainMenu from './components/MainMenu';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Barra de navegación ultrabásica para desarrollo */}
        <nav className="p-4 bg-gray-800 flex gap-4 border-b border-gray-700">
          <Link to="/" className="text-blue-400 hover:text-blue-300 font-bold">Menú Principal</Link>
          <Link to="/logs" className="text-red-400 hover:text-red-300 font-bold">Debug Logs</Link>
        </nav>

        <div className="p-4">
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/logs" element={<Lobby />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";
import MainMenu from "./components/MainMenu.tsx";
import WaitingRoom from "./components/WaitingRoom.tsx";
import GameBoard from "./components/GameBoard.tsx";
import { Logs } from "./components/Logs.tsx";

function App() {
	return (
		<Router>
			<div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
				{/* Cabecera extraída a su propio componente */}
				<Navbar />

				<div className="p-6 grow">
					<Routes>
						<Route path="/" element={<MainMenu />} />
						<Route path="/room/:id" element={<WaitingRoom />} />
						<Route path="/game/:id" element={<GameBoard />} />{" "}
						<Route path="/logs" element={<Logs />} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;

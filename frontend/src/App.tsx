import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar.tsx";
import { GlobalLoader } from "./components/ui/GlobalLoader.tsx";

// -- PÁGINAS --
import MainMenuPage from "./pages/MainMenuPage.tsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.tsx";
import GameBoardPage from "./pages/GameBoardPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RoomNotFoundPage from "./pages/RoomNotFoundPage.tsx";

import { useAuthStore } from "./store/useAuthStore.ts";
import { useEffect } from "react";
import api from "./api/axios.ts";

function App() {
	const { token } = useAuthStore();

	useEffect(() => {
		// Si hay token en el frontend, comprobamos si sigue vivo en el backend
		const verifySession = async () => {
			if (!token) return;

			await api.get("/me");
		};

		verifySession();
	}, [token]);

	return (
		<Router>
			<div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
				<GlobalLoader />
				<Navbar />

				<div className="p-6 grow">
					<Routes>
						<Route path="/" element={<MainMenuPage />} />
						<Route path="/room/:id" element={<WaitingRoomPage />} />
						<Route path="/game/:id" element={<GameBoardPage />} />
						<Route path="/profile" element={<ProfilePage />} />
						<Route path="/admin" element={<AdminPage />} />
						<Route path="/room-not-found" element={<RoomNotFoundPage />} />
					</Routes>
				</div>
			</div>
		</Router>
	);
}

export default App;

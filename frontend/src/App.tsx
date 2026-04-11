import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// -- PÁGINAS --
import RoomsPage from "./pages/RoomsPage.tsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.tsx";
import GameBoardPage from "./pages/GameBoardPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RoomNotFoundPage from "./pages/RoomNotFoundPage.tsx";

import { useAuthStore } from "./store/useAuthStore.ts";
import { useEffect } from "react";
import api from "./api/axios.ts";

import { GlobalLoader } from "./components/ui/GlobalLoader.tsx";
import MainMenuPage from "./pages/MainMenuPage.tsx";
import NotebookLayout from "./layouts/NotebookLayout.tsx";

function App() {
	const { token } = useAuthStore();

	useEffect(() => {
		// Si hay token en el frontend, comprobamos si sigue vivo en el backend
		const verifySession = async () => {
			if (!token) return;

			await api.get("/me", { hideLoader: true } as any);
		};

		verifySession();
	}, [token]);

	return (
		<Router>
			<Routes>
				{/* ── Rutas con el diseño de libreta ── */}
				<Route element={<NotebookLayout />}>
					<Route path="/" element={<MainMenuPage />} />
					<Route path="/rooms" element={<RoomsPage />} />
					<Route path="/profile" element={<ProfilePage />} />
					{/* Añadir aquí: /saber-mas, /como-jugar, etc. */}
				</Route>

				{/* ── Rutas con diseño propio ── */}
				<Route path="/room/:id" element={<WaitingRoomPage />} />
				<Route path="/game/:id" element={<GameBoardPage />} />
				<Route path="/admin" element={<AdminPage />} />
				<Route path="/room-not-found" element={<RoomNotFoundPage />} />
			</Routes>

			<GlobalLoader />
		</Router>
	);
}

export default App;

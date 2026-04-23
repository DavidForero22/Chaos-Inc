import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// -- PÁGINAS --
import RoomsPage from "./pages/RoomsPage.tsx";
import WaitingRoomPage from "./pages/WaitingRoomPage.tsx";
import GameBoardPage from "./pages/GameBoardPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RoomNotFoundPage from "./pages/RoomNotFoundPage.tsx";
import HowToPlayPage from "./pages/HowToPlayPage.tsx";
import KnowMorePage from "./pages/KnowMorePage.tsx";

import { GlobalLoader } from "./components/ui/GlobalLoader.tsx";
import MainMenuPage from "./pages/MainMenuPage.tsx";
import NotebookLayout from "./layouts/NotebookLayout.tsx";
import { useSessionGuard } from "./hooks/useSessionGuard.ts";

function App() {
	useSessionGuard();

	return (
		<Router>
			<Routes>
				{/* ── Rutas con el diseño de libreta ── */}
				<Route element={<NotebookLayout />}>
					<Route path="/" element={<MainMenuPage />} />
					<Route path="/rooms" element={<RoomsPage />} />
					<Route path="/profile" element={<ProfilePage />} />
					<Route path="/how-to-play" element={<HowToPlayPage />} />
					<Route path="/know-more" element={<KnowMorePage />} />
					<Route path="/admin" element={<AdminPage />} />
				</Route>

				{/* ── Rutas con diseño propio ── */}
				<Route path="/room/:id" element={<WaitingRoomPage />} />
				<Route path="/game/:id" element={<GameBoardPage />} />
				<Route path="/room-not-found" element={<RoomNotFoundPage />} />
			</Routes>

			<GlobalLoader />
		</Router>
	);
}

export default App;

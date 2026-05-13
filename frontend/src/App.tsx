import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";

// -- PÁGINAS --
import RoomsPage from "./pages/rooms/RoomsPage.tsx";
import WaitingRoomPage from "./pages/waitingRoom/WaitingRoomPage.tsx";
import GameBoardPage from "./pages/GameBoardPage.tsx";
import ProfilePage from "./pages/profile/ProfilePage.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import RoomNotFoundPage from "./pages/errors/RoomNotFoundPage.tsx";
import HowToPlayPage from "./pages/info/HowToPlayPage.tsx";
import KnowMorePage from "./pages/info/KnowMorePage.tsx";
import SocialLinkingErrorPage from "./pages/errors/SocialLinkingErrorPage.tsx";

import { GlobalLoader } from "./components/ui/GlobalLoader.tsx";
import MainMenuPage from "./pages/MainMenuPage.tsx";
import NotebookLayout from "./layouts/NotebookLayout.tsx";
import { useSessionGuard } from "./hooks/useSessionGuard.ts";
import PublicProfilePage from "./pages/profile/PublicProfilePage.tsx";
import { AchievementNotification } from "./components/ui/AchievementNotification.tsx";
import AdminGuard from "./components/admin/AdminGuard.tsx";
import UnauthorizedPage from "./pages/errors/UnauthorizedPage.tsx";
import PageNotFoundPage from "./pages/errors/PageNotFoundPage.tsx";
import { Toast } from "./components/ui/Toast/Toast.tsx";

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
					<Route path="/profile/:userId" element={<PublicProfilePage />} />
					<Route path="/how-to-play" element={<HowToPlayPage />} />
					<Route path="/know-more" element={<KnowMorePage />} />

					{/* ── Ruta protegida para administradores ── */}
					<Route element={<AdminGuard />}>
						<Route path="/admin" element={<AdminPage />} />
					</Route>
				</Route>

				{/* ── Rutas con diseño propio ── */}
				<Route path="/rooms/:id" element={<WaitingRoomPage />} />
				<Route path="/game/:id" element={<GameBoardPage />} />

				{/* ── Páginas de Error Explícitas ── */}
				<Route path="/room-not-found" element={<RoomNotFoundPage />} />
				<Route path="/social-error" element={<SocialLinkingErrorPage />} />
				<Route path="/unauthorized" element={<UnauthorizedPage />} />

				{/* ── Rutas Trampapara URLs incorrectas ── */}
				<Route
					path="/rooms/*"
					element={<Navigate to="/room-not-found" replace />}
				/>
				<Route path="*" element={<PageNotFoundPage />} />
			</Routes>
			{/* ── COMPONENTES GLOBALES ── */}
			<GlobalLoader />
			<AchievementNotification />
			<Toast /> 
		</Router>
	);
}

export default App;

import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";

// -- IMPORTACIONES SÍNCRONAS (Componentes globales y Layouts siempre visibles) --
import { GlobalLoader } from "./components/ui/GlobalLoader.tsx";
import NotebookLayout from "./layouts/NotebookLayout.tsx";
import { useSessionGuard } from "./hooks/useSessionGuard.ts";
import { AchievementNotification } from "./components/ui/AchievementNotification.tsx";
import AdminGuard from "./components/admin/AdminGuard.tsx";
import { Toast } from "./components/ui/Toast/Toast.tsx";
import { GlobalRoomManager } from "./components/lobby/GlobalRoomManager.tsx";
import RoomJoinInterceptor from "./components/lobby/RoomJoinInterceptor.tsx";
import LeaderboardPage from "./pages/leaderboard/LeaderboardPage.tsx";

// -- IMPORTACIONES PEREZOSAS --
// Solo se descargarán cuando el usuario intente acceder a esa ruta
const MainMenuPage = lazy(() => import("./pages/MainMenuPage.tsx"));
const RoomsPage = lazy(() => import("./pages/rooms/RoomsPage.tsx"));
const GameBoardPage = lazy(() => import("./pages/GameBoardPage.tsx"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage.tsx"));
const PublicProfilePage = lazy(
	() => import("./pages/profile/PublicProfilePage.tsx"),
);
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const HowToPlayPage = lazy(() => import("./pages/info/HowToPlayPage.tsx"));
const KnowMorePage = lazy(() => import("./pages/info/KnowMorePage.tsx"));

// Páginas de Error (Lazy)
const RoomNotFoundPage = lazy(
	() => import("./pages/errors/RoomNotFoundPage.tsx"),
);
const SocialLinkingErrorPage = lazy(
	() => import("./pages/errors/SocialLinkingErrorPage.tsx"),
);
const UnauthorizedPage = lazy(
	() => import("./pages/errors/UnauthorizedPage.tsx"),
);
const PageNotFoundPage = lazy(
	() => import("./pages/errors/PageNotFoundPage.tsx"),
);
const UserNotFoundPage = lazy(
	() => import("./pages/errors/UserNotFoundPage.tsx"),
);
const RoomFullPage = lazy(() => import("./pages/errors/RoomFullPage.tsx"));
const GameAlreadyStartedPage = lazy(
	() => import("./pages/errors/GameAlreadyStartedPage.tsx"),
);
const AlreadyInAnotherRoomPage = lazy(
	() => import("./pages/errors/AlreadyInAnotherRoomPage.tsx"),
);

// ── Cargador estático para la navegación ──
const PageTransitionLoader = () => (
	<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#393e42] text-white font-mono">
		<div className="animate-pulse">Cargando página...</div>
	</div>
);

function App() {
	useSessionGuard();

	return (
		<Router>
			{/* Suspense muestra el GlobalLoader mientras se descarga el JS de la página destino */}
			<Suspense fallback={<PageTransitionLoader />}>
				<Routes>
					{/* ── Rutas con el diseño de libreta ── */}
					<Route element={<NotebookLayout />}>
						<Route path="/" element={<MainMenuPage />} />
						<Route path="/rooms" element={<RoomsPage />} />
						<Route path="/leaderboard" element={<LeaderboardPage />} />
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
					<Route path="/rooms/:id" element={<RoomJoinInterceptor />} />
					<Route path="/game/:id" element={<GameBoardPage />} />

					{/* ── Páginas de Error Explícitas ── */}
					<Route path="/room-not-found" element={<RoomNotFoundPage />} />
					<Route path="/social-error" element={<SocialLinkingErrorPage />} />
					<Route path="/unauthorized" element={<UnauthorizedPage />} />
					<Route path="/user-not-found" element={<UserNotFoundPage />} />
					<Route path="/room-full" element={<RoomFullPage />} />
					<Route
						path="/game-already-started"
						element={<GameAlreadyStartedPage />}
					/>
					<Route
						path="/already-in-another-room"
						element={<AlreadyInAnotherRoomPage />}
					/>

					{/* ── Rutas Trampa para URLs incorrectas ── */}
					<Route
						path="/rooms/*"
						element={<Navigate to="/room-not-found" replace />}
					/>
					<Route path="*" element={<PageNotFoundPage />} />
				</Routes>
			</Suspense>

			{/* ── COMPONENTES GLOBALES ── */}
			<GlobalRoomManager />
			<AchievementNotification />
			<Toast />
			<GlobalLoader />
		</Router>
	);
}

export default App;

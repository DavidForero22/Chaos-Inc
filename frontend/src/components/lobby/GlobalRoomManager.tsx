import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useRoom } from "../../hooks/room/useRoom";
import { useLoadingStore } from "../../store/ui/useLoadingStore";

import GuestNameModal from "./GuestNameModal";
import RoomPasswordBoard from "./RoomPasswordBoard";
import WaitingRoomDrawer from "./WaitingRoomDrawer";

// Rutas donde NO queremos que se vea el widget (porque la UI propia ya lo gestiona)
const EXCLUDED_PATHS = [
	"/game",
	"/room-not-found",
	"/room-full",
	"/game-already-started",
	"/unauthorized",
	"/user-not-found",
	"/already-in-another-room",
];

export function GlobalRoomManager() {
	const location = useLocation();
	const { startLoading, stopLoading } = useLoadingStore();

	// Obtenemos el roomId global. Si es null, no estamos en ninguna sala.
	const roomId = useRoomStore((state) => state.roomId);
	const currentUserId = useAuthStore((state) => state.id);

	// Ejecutamos el hook maestro de la sala (esto mantiene los websockets vivos globalmente)
	const {
		room,
		user,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
		kickPlayer,
	} = useRoom(roomId || undefined);

	const [copied, setCopied] = useState(false);

	// 1. Verificamos si estamos en una ruta excluida (ej: Ya empezó la partida)
	const isExcluded = EXCLUDED_PATHS.some((path) =>
		location.pathname.startsWith(path),
	);
	if (isExcluded || !roomId) return null;

	// 2. Modales de Ingreso (Prioridad Alta)
	// Si necesitas clave, renderizamos tu modal de clave por encima de todo
	if (needsPassword) {
		return (
			<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
				<RoomPasswordBoard
					roomId={roomId}
					error={passwordError}
					onCancel={() => useRoomStore.getState().resetRoomStore(false)}
					onSubmit={attemptJoin}
				/>
			</div>
		);
	}

	// Si eres invitado y necesitas nombre
	if (!user) {
		return (
			<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
				<GuestNameModal
					onClose={() => useRoomStore.getState().resetRoomStore(false)}
					onSuccess={() => attemptJoin()}
				/>
			</div>
		);
	}

	// 3. Renderizamos el Panel Lateral si tenemos datos de la sala
	if (!room) return null;

	const isOwner = String(room.owner_id) === String(currentUserId);
	const missingPlayers = Math.max(
		0,
		room.max_players - (room.players?.length || 0),
	);

	const handleShare = async () => {
		try {
			// Genera el enlace de invitación
			await navigator.clipboard.writeText(
				`${window.location.origin}/rooms/${roomId}`,
			);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	const handleLeave = async () => {
		startLoading("Saliendo...");
		await handleLeaveRoom();
		stopLoading();
	};

	const handleKick = async (playerIdToKick: string) => {
		startLoading("Expulsando jugador...");
		await kickPlayer(playerIdToKick);
		stopLoading();
	};

	return (
		<WaitingRoomDrawer
			room={room}
			isOwner={isOwner}
			currentUserId={currentUserId}
			missingPlayers={missingPlayers}
			onLeave={handleLeave}
			onStart={startGame}
			onKick={handleKick}
			onShare={handleShare}
			copied={copied}
		/>
	);
}

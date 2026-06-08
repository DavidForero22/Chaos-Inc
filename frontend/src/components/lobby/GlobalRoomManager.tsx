import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useRoom } from "../../hooks/room/useRoom";
import { useLoadingStore } from "../../store/ui/useLoadingStore";

import GuestNameModal from "./GuestNameModal";
import RoomPasswordBoard from "./RoomPasswordModal";
import WaitingRoomDrawer from "./WaitingRoomDrawer";
import ActiveGameBanner from "./ActiveGameBanner";

// Rutas donde no se ve el widget
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

	const roomId = useRoomStore((state) => state.roomId);
	const currentUserId = useAuthStore((state) => state.id);

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

	console.log(room);

	const [copied, setCopied] = useState(false);

	// Verificar si esta en una ruta excluida
	const isExcluded = EXCLUDED_PATHS.some((path) =>
		location.pathname.startsWith(path),
	);

	if (isExcluded || !roomId) return null;

	// Si necesitas contraseña
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

	// Si no está registrado
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

	if (!room) return null;

	// Si la partida ya empezó
	if (room.status === "in_game") {
		return <ActiveGameBanner roomId={room.room_id} roomName={room.name} />;
	}

	// Lógica del Drawer para cuando el status es "waiting"
	const isOwner = String(room.owner_id) === String(currentUserId);
	const missingPlayers = Math.max(
		0,
		room.max_players - (room.players?.length || 0),
	);

	const handleShare = async () => {
		try {
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

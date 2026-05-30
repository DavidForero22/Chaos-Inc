import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useLoadingStore } from "../../store/ui/useLoadingStore";

export default function RoomJoinInterceptor() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { setRoomId, setIsJoining } = useRoomStore();
	const { startLoading, stopLoading } = useLoadingStore();

	useEffect(() => {
		if (id) {
			startLoading("Preparando entrada...");
			// Guardar el ID y forzar el estado de unión
			setRoomId(id);
			setIsJoining(true);
			useRoomStore.setState({ needsPassword: false });
			
			stopLoading();
			// Redirigir al lobby para que muestre la interfaz (modal invitado o panel)
			navigate("/rooms", { replace: true });
		} else {
			navigate("/room-not-found", { replace: true });
		}
	}, [id, setRoomId, navigate, startLoading, stopLoading]);

	return null;
}

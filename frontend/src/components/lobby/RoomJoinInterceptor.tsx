// src/pages/waitingRoom/RoomJoinInterceptor.tsx

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useLoadingStore } from "../../store/ui/useLoadingStore";

export default function RoomJoinInterceptor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const setRoomId = useRoomStore((state) => state.setRoomId);
    const { startLoading, stopLoading } = useLoadingStore();

    useEffect(() => {
        if (id) {
            startLoading("Preparando entrada...");
            // 1. Guardamos el ID. El GlobalRoomManager detectará esto y pedirá contraseña/nombre si es necesario
            setRoomId(id);
            stopLoading();
            // 2. Redirigimos al lobby para que pueda navegar
            navigate("/rooms", { replace: true });
        } else {
            navigate("/room-not-found", { replace: true });
        }
    }, [id, setRoomId, navigate, startLoading, stopLoading]);

    return null; // Este componente no dibuja nada en pantalla
}
import { useEffect } from "react";
import echo from "../../echo";

interface UseGameSocketsProps {
    roomId: string | undefined;
    refreshGameData: () => void;
}

export function useGameSockets({ roomId, refreshGameData }: UseGameSocketsProps) {
    useEffect(() => {
        if (!roomId) return;

        const channel = echo.channel(`room.${roomId}`);

        // Escucha cualquier cambio de estado
        channel.listen(".RoomStateUpdated", () => {
            console.log("El estado del tablero ha cambiado, recargando...");
            refreshGameData();
        });

        return () => {
            channel.stopListening(".RoomStateUpdated");
            echo.leaveChannel(`room.${roomId}`);
        };
    }, [roomId, refreshGameData]);
}
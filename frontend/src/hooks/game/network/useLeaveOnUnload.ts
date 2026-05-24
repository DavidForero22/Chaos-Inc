import { useEffect } from "react";
import { sendLeaveBeacon } from "../../../utils/leaveRoom";

export function useLeaveOnUnload(
	roomId: string | undefined,
	canLeave?: () => boolean,
) {
	useEffect(() => {
		if (!roomId) return;

		const handleUnload = () => {
			if (canLeave && !canLeave()) return;
			sendLeaveBeacon(roomId);
		};

		window.addEventListener("pagehide", handleUnload);

		return () => {
			window.removeEventListener("pagehide", handleUnload);
			handleUnload();
		};
	}, [roomId]);
}

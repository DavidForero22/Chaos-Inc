import api from "../api/axios";

export function sendLeaveBeacon(roomId: string) {
	const gameToken = localStorage.getItem("game_token");
	if (!gameToken) return;

	const base = api.defaults.baseURL ?? "";
	const url = `${base}/rooms/${encodeURIComponent(roomId)}/leave`;
	const blob = new Blob([JSON.stringify({})], { type: "application/json" });

	navigator.sendBeacon(`${url}?game_token=${gameToken}`, blob);
}

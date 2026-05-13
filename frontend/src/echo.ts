// src/echo.ts

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import api from "./api/axios";
import { logWithTime } from "./utils/logger";

declare global {
	interface Window {
		Pusher: typeof Pusher;
		Echo: Echo<"reverb">;
	}
}

window.Pusher = Pusher;

const echoInstance = new Echo({
	broadcaster: "reverb",
	key: import.meta.env.VITE_REVERB_APP_KEY,
	wsHost: import.meta.env.VITE_REVERB_HOST,
	wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 80),
	wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
	forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
	enabledTransports: ["ws", "wss"],

	// Autorización limpia y delegada en Axios
	authorizer: (channel: any) => {
		return {
			authorize: (socketId: string, callback: Function) => {
				api
					.post("http://localhost:8000/broadcasting/auth", {
						socket_id: socketId,
						channel_name: channel.name,
					})
					.then((response) => {
						callback(false, response.data);
					})
					.catch((error) => {
						logWithTime("echo.ts::.catch - Error autorizando canal de Echo", error, "error");
						callback(true, error);
					});
			},
		};
	},
});

window.Echo = echoInstance;

export default echoInstance;

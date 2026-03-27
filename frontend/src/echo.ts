import Echo from "laravel-echo";
import Pusher from "pusher-js";

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

	authorizer: (channel) => ({
		authorize: (socketId, callback) => {
			const token = localStorage.getItem("token") ?? "";

			fetch(`${import.meta.env.VITE_API_URL}/broadcasting/auth`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					socket_id: socketId,
					channel_name: channel.name,
				}),
			})
				.then((res) => {
					if (!res.ok) {
						throw new Error(`Auth fallida: ${res.status}`);
					}
					return res.json();
				})
				.then((data) => {
					callback(null, data);
				})
				.catch((err) => {
					callback(err, null);
				});
		},
	}),
});

window.Echo = echoInstance;

export default echoInstance;

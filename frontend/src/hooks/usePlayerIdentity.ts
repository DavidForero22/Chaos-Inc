import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export function usePlayerIdentity() {
	const location = useLocation();
	const { user } = useAuthStore();

	const [myPlayerName] = useState(() => {
		if (user) return user;

		if (location.state?.playerName) {
			sessionStorage.setItem("guestName", location.state.playerName);
			return location.state.playerName;
		}

		const savedGuest = sessionStorage.getItem("guestName");
		if (savedGuest) return savedGuest;

		const newGuest = `Anon_${Math.floor(Math.random() * 1000)}_${Date.now().toString().slice(-4)}`;
		sessionStorage.setItem("guestName", newGuest);
		return newGuest;
	});

	return { myPlayerName, user };
}

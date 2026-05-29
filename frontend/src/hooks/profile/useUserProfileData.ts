// src/hooks/profile/useUserProfileData.ts

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import type { GameRecord } from "../../types/api.ts";
import type { FriendRequest, UserRecord } from "../../types/user.ts";
import { getFullAvatarUrl } from "../../utils/avatar.ts";

export function useUserProfileData(userId: string | undefined, refreshKey = 0) {
	const { id: myId, isGuest } = useAuthStore();
	const navigate = useNavigate();

	const [games, setGames] = useState<GameRecord[]>([]);
	const [profileUser, setProfileUser] = useState<UserRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [pendingReceived, setPendingReceived] = useState<FriendRequest[]>([]);
	const [pendingSent, setPendingSent] = useState<FriendRequest[]>([]);
	const [friendsLoading, setFriendsLoading] = useState(false);

	const fetchData = useCallback(async () => {
		if (!userId || (!myId && !isGuest)) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const gamesEndpoint =
				String(myId) === userId ? "/me/games" : `/users/${userId}/games`;

			const [userRes, gamesRes] = await Promise.all([
				api.get(`/users/${userId}`, { hideLoader: true } as any),
				api.get(gamesEndpoint, { hideLoader: true } as any),
			]);

			const newProfileUser = userRes.data.data ?? userRes.data;

			const newGames = gamesRes.data.data ?? gamesRes.data;
			const normalizedProfileUser = newProfileUser
				? { ...newProfileUser, avatar: getFullAvatarUrl(newProfileUser.avatar) }
				: null;

			setProfileUser(normalizedProfileUser);
			setGames(newGames);

			// Si es mi perfil, también actualizar AuthStore con los datos más recientes
			if (String(myId) === userId && newProfileUser) {
				const { setAuth } = useAuthStore.getState();

				setAuth(
					newProfileUser.id,
					newProfileUser.username,
					getFullAvatarUrl(newProfileUser.avatar),
					newProfileUser.isGuest,
					newProfileUser.role,
					newProfileUser.socialAccounts,
					newProfileUser.joinedAt,
					newProfileUser.achievements,
				);

				await loadFriendRequests();
			}
		} catch (error: any) {
			// Si es 404, redirigir a la página de usuario no encontrado
			if (error?.response?.status === 404) {
				navigate("/user-not-found", { replace: true });
				return;
			}
			console.error("Error fetching user profile:", error);
		} finally {
			setLoading(false);
		}
	}, [userId, myId, isGuest, navigate]);

	const loadFriendRequests = async () => {
		setFriendsLoading(true);
		try {
			const [receivedRes, sentRes] = await Promise.all([
				api.get("/friends/pending"),
				api.get("/friends/sent"),
			]);
			setPendingReceived(receivedRes.data.data ?? []);
			setPendingSent(sentRes.data.data ?? []);
		} catch (error) {
			console.error("Error loading friend requests:", error);
		} finally {
			setFriendsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [fetchData, refreshKey]);

	// Método para refrescar manualmente desde fuera
	const refreshUserData = useCallback(() => {
		fetchData();
	}, [fetchData]);

	return {
		games,
		profileUser,
		loading,
		refreshUserData,
		pendingReceived,
		pendingSent,
		friendsLoading,
		loadFriendRequests,
	};
}

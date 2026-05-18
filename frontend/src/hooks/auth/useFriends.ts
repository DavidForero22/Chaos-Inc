// src/hooks/useFriends.ts

import { useFriendsStore } from "../../store/auth/useFriendsStore.ts";

export function useFriends() {
	const {
		friends,
		pendingReceived,
		pendingSent,
		isLoading,
		error,
		fetchFriends,
		fetchPendingReceived,
		fetchPendingSent,
		sendRequest,
		acceptRequest,
		rejectRequest,
		removeFriend,
		clearError,
	} = useFriendsStore();

	return {
		// datos
		friends,
		pendingReceived,
		pendingSent,
		isLoading,
		error,

		// acciones
		fetchFriends,
		fetchPendingReceived,
		fetchPendingSent,
		sendRequest, // enviar solicitud de amistad
		acceptRequest, // aceptar solicitud recibida
		rejectRequest, // rechazar/cancelar solicitud recibida
		removeFriend, // eliminar amigo o cancelar solicitud enviada
		clearError,
	};
}

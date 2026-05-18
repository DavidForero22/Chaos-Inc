// src/hooks/profile/useFriendActions.ts

import { useState, useEffect, useCallback } from "react";
import { useFriends } from "../auth/useFriends";
import { useToastStore } from "../../store/ui/useToastStore";
import { useFriendsStore } from "../../store/auth/useFriendsStore";

interface UseFriendActionsOptions {
	userId?: number | null;
	notMyProfile: boolean;
	onRefreshProfile?: () => void;
}

export function useFriendActions({
	userId,
	notMyProfile,
	onRefreshProfile,
}: UseFriendActionsOptions) {
	const {
		pendingReceived,
		pendingSent,
		isLoading: friendsLoading,
		fetchPendingReceived,
		fetchPendingSent,
		sendRequest,
		acceptRequest,
		rejectRequest,
		removeFriend,
		fetchFriends,
		friends,
	} = useFriends();

	const showToast = useToastStore((state) => state.showToast);

	const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
	const [isSendingRequest, setIsSendingRequest] = useState(false);

	// Cargar solicitudes recibidas al montar si es perfil propio (para el badge)
	useEffect(() => {
		if (!notMyProfile) {
			fetchPendingReceived();
		}
	}, [notMyProfile, fetchPendingReceived]);

	// Cargar solicitudes enviadas cuando se abre el modal
	useEffect(() => {
		if (showFriendRequestsModal) {
			fetchPendingSent();
		}
	}, [showFriendRequestsModal, fetchPendingSent]);

	// Cargar mis amigos al montar (siempre, para saber si el perfil visitado es amigo mío)
	useEffect(() => {
		if (!notMyProfile || userId) {
			fetchFriends();
		}
	}, [notMyProfile, userId, fetchFriends]);

	// Enviar solicitud de amistad a otro usuario
	const handleSendFriendRequest = useCallback(async () => {
		if (!userId) return;
		setIsSendingRequest(true);
		try {
			const success = await sendRequest(userId);
			if (success) {
				showToast("Solicitud de amistad enviada", "success");
			} else {
				const storeError = useFriendsStore.getState().error;
				showToast(storeError || "No se pudo enviar la solicitud", "danger");
			}
		} catch {
			showToast("Error de red al enviar la solicitud", "danger");
		} finally {
			setIsSendingRequest(false);
		}
	}, [userId, sendRequest, showToast]);

	// Aceptar solicitud recibida
	const handleAcceptRequest = useCallback(
		async (targetUserId: number) => {
			try {
				const success = await acceptRequest(targetUserId);
				if (success) {
					showToast("Solicitud aceptada", "success");
					onRefreshProfile?.(); // actualiza la lista de amigos
				} else {
					showToast(
						useFriendsStore.getState().error || "Error al aceptar",
						"danger",
					);
				}
			} catch {
				showToast("Error de red al aceptar", "danger");
			}
		},
		[acceptRequest, showToast, onRefreshProfile],
	);

	// Rechazar solicitud recibida
	const handleRejectRequest = useCallback(
		async (targetUserId: number) => {
			try {
				const success = await rejectRequest(targetUserId);
				if (success) {
					showToast("Solicitud rechazada", "success");
				} else {
					showToast(
						useFriendsStore.getState().error || "Error al rechazar",
						"danger",
					);
				}
			} catch {
				showToast("Error de red al rechazar", "danger");
			}
		},
		[rejectRequest, showToast],
	);

	// Cancelar solicitud enviada
	const handleCancelRequest = useCallback(
		async (targetUserId: number) => {
			try {
				const success = await removeFriend(targetUserId);
				if (success) {
					showToast("Solicitud cancelada", "success");
					onRefreshProfile?.();
				} else {
					showToast(
						useFriendsStore.getState().error || "Error al cancelar",
						"danger",
					);
				}
			} catch {
				showToast("Error de red al cancelar", "danger");
			}
		},
		[removeFriend, showToast, onRefreshProfile],
	);

	const handleRemoveFriend = useCallback(
		async (targetUserId: number) => {
			try {
				const success = await removeFriend(targetUserId);
				if (success) {
					showToast("Amigo eliminado", "success");
					onRefreshProfile?.(); // actualiza la lista de amigos en el padre
				} else {
					showToast(
						useFriendsStore.getState().error || "Error al eliminar amigo",
						"danger",
					);
				}
			} catch {
				showToast("Error de red al eliminar amigo", "danger");
			}
		},
		[removeFriend, showToast, onRefreshProfile],
	);

	return {
		pendingReceived,
		pendingSent,
		friendsLoading,
		myFriends: friends,
		showFriendRequestsModal,
		setShowFriendRequestsModal,
		isSendingRequest,
		handleSendFriendRequest,
		handleAcceptRequest,
		handleRejectRequest,
		handleCancelRequest,
		handleRemoveFriend,
	};
}

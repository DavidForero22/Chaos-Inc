import api from "../../api/axios";
import { getFullAvatarUrl } from "../../utils/avatar";
import { useAuthStore } from "../auth/useAuthStore";
import { useToastStore } from "../ui/useToastStore";
import type { ProfileStore } from "./profileStoreTypes";

export const createProfileActions = (
	set: (
		partial:
			| Partial<ProfileStore>
			| ((state: ProfileStore) => Partial<ProfileStore>),
	) => void,
	get: () => ProfileStore,
): Partial<ProfileStore> => ({
	// ---------- setters ----------
	setActiveTab: (tab) => set({ activeTab: tab }),
	setShowAvatarModal: (v) => set({ showAvatarModal: v }),
	setShowUnlinkModal: (v) => set({ showUnlinkModal: v }),
	setShowFriendRequestsModal: (v) => set({ showFriendRequestsModal: v }),
	setShowRemoveFriendModal: (v) => set({ showRemoveFriendModal: v }),
	setShowForcePasswordModal: (v) => set({ showForcePasswordModal: v }),
	setProviderToUnlink: (p) => set({ providerToUnlink: p }),
	setUnlinkPassword: (p) => set({ unlinkPassword: p }),
	setUnlinkPasswordError: (e) => set({ unlinkPasswordError: e }),
	setShowGalleryModal: (v) => set({ showGalleryModal: v }),

	// ---- avatar ----
	handleAvatarClick: () => {
		if (get().notMyProfile) return;
		set({ showAvatarModal: true });
	},
	handleFileChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(file.type)) {
			useToastStore
				.getState()
				.showToast("Formato no soportado. Usa JPEG, PNG o WEBP.", "warn");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			useToastStore
				.getState()
				.showToast("La imagen no puede superar los 5MB.", "warn");
			return;
		}

		set({ isUploading: true });
		try {
			const form = new FormData();
			form.append("avatar", file);

			const userId = get().userId;
			const response = await api.post(`/users/${userId}/avatar`, form, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			// Obtener la ruta devuelta por el backend
			const rawAvatar =
				response.data.user?.avatar || response.data.avatar || null;
			const normalizedAvatar = rawAvatar ? getFullAvatarUrl(rawAvatar) : null;

			// Actualizar el store de autenticación (para AvatarPolaroid)
			useAuthStore.getState().setAvatar(normalizedAvatar);

			// También actualizar el userRecord del perfil con la URL normalizada
			const currentUserRecord = get().userRecord;
			if (currentUserRecord) {
				set({
					userRecord: {
						...currentUserRecord,
						avatar: normalizedAvatar,
					},
				});
			}

			// Refrescar perfil desde el backend
			await get().refreshProfile();

			const updatedRecord = get().userRecord;
			if (updatedRecord?.avatar) {
				set({
					userRecord: {
						...updatedRecord,
						avatar: getFullAvatarUrl(updatedRecord.avatar),
					},
				});
			}

			set({ showAvatarModal: false, isUploading: false });
			useToastStore
				.getState()
				.showToast("Avatar actualizado correctamente", "success");
		} catch (err: any) {
			console.error("Error subiendo avatar:", err);
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al subir avatar",
					"danger",
				);
			set({ isUploading: false });
		} finally {
			if (e.target) e.target.value = "";
		}
	},

	handleSelectProviderAvatar: async (provider, avatarUrl) => {
		if (!avatarUrl) return;
		try {
			const response = await api.post(`/users/${get().userId}/avatar`, {
				provider,
				avatarUrl,
			});

			const newAvatar = response.data.avatar || null;
			useAuthStore.getState().setAvatar(getFullAvatarUrl(newAvatar));

			await get().refreshProfile();

			// Re-normalizar tras el refresh
			const updatedRecord = get().userRecord;
			if (updatedRecord?.avatar) {
				set({
					userRecord: {
						...updatedRecord,
						avatar: getFullAvatarUrl(updatedRecord.avatar),
					},
				});
			}

			set({ showAvatarModal: false });
			useToastStore
				.getState()
				.showToast(`Avatar actualizado desde ${provider}`, "success");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al actualizar avatar",
					"danger",
				);
		}
	},

	handleProviderClick: (provider: string, isLinked: boolean) => {
		const { notMyProfile } = get();
		if (notMyProfile) return;

		if (isLinked) {
			set({ providerToUnlink: provider, showUnlinkModal: true });
		} else {
			const rawUrl =
				import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
			const backendUrl = rawUrl.replace(/\/api\/v1\/?$/, "");
			window.location.href = `${backendUrl}/auth/${provider}/redirect`;
		}
	},

	confirmUnlink: async () => {
		const { providerToUnlink, userId } = get();
		if (!providerToUnlink || !userId) return;
		try {
			const response = await api.post(`/auth/unlink/${providerToUnlink}`);

			const updatedUser = response.data.user;
			if (updatedUser) {
				useAuthStore
					.getState()
					.setAuth(
						updatedUser.id,
						updatedUser.username,
						updatedUser.avatar,
						updatedUser.isGuest,
						updatedUser.role,
						updatedUser.socialAccounts,
						updatedUser.joinedAt,
						updatedUser.achievements,
					);
			}

			set({ showUnlinkModal: false, showForcePasswordModal: false });
			get().refreshProfile();
			useToastStore
				.getState()
				.showToast(`Cuenta de ${providerToUnlink} desvinculada`, "success");
		} catch (err: any) {
			if (err.response?.status === 403) {
				set({ showForcePasswordModal: true });
			} else {
				useToastStore
					.getState()
					.showToast(
						err.response?.data?.message || "Error al desvincular",
						"danger",
					);
			}
		}
	},

	closeForcePasswordModal: () => {
		set({
			showForcePasswordModal: false,
			unlinkPassword: "",
			unlinkPasswordError: "",
		});
	},

	// ---- amistad ----
	loadFriendRequests: async () => {
		set({ friendsLoading: true });
		try {
			const [receivedRes, sentRes] = await Promise.all([
				api.get("/friends/pending", { hideLoader: true } as any),
				api.get("/friends/sent", { hideLoader: true } as any),
			]);
			set({
				pendingReceived: receivedRes.data.data ?? [],
				pendingSent: sentRes.data.data ?? [],
				friendsLoading: false,
			});
		} catch (error) {
			console.error("Error loading friend requests:", error);
			set({ friendsLoading: false });
		}
	},

	sendFriendRequest: async () => {
		const { userId, notMyProfile } = get();
		if (!notMyProfile || !userId) return;
		set({ isSendingRequest: true });
		try {
			await api.post(`/friends/${userId}/request`);
			get().loadFriendRequests();
			useToastStore
				.getState()
				.showToast("Solicitud de amistad enviada", "success");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al enviar solicitud",
					"danger",
				);
		} finally {
			set({ isSendingRequest: false });
		}
	},

	acceptRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/accept`);
			get().loadFriendRequests();
			get().refreshProfile();
			useToastStore.getState().showToast("Solicitud aceptada", "success");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(err.response?.data?.message || "Error al aceptar", "danger");
		}
	},

	rejectRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/reject`);
			get().loadFriendRequests();
			useToastStore.getState().showToast("Solicitud rechazada", "info");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al rechazar",
					"danger",
				);
		}
	},

	cancelRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/cancel`);
			get().loadFriendRequests();
			useToastStore.getState().showToast("Solicitud cancelada", "info");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al cancelar",
					"danger",
				);
		}
	},

	removeFriend: async (friendId) => {
		try {
			await api.delete(`/friends/${friendId}`);
			get().refreshProfile();
			set({ showRemoveFriendModal: false });
			useToastStore.getState().showToast("Amigo eliminado", "info");
		} catch (err: any) {
			useToastStore
				.getState()
				.showToast(
					err.response?.data?.message || "Error al eliminar amigo",
					"danger",
				);
		}
	},
});

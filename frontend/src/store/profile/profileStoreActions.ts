import api from "../../api/axios";
import { getFullAvatarUrl } from "../../utils/avatar";
import { useAuthStore } from "../auth/useAuthStore";
import type { ProfileStore } from "./profileStoreTypes";

export const createProfileActions = (
	set: (
		partial:
			| Partial<ProfileStore>
			| ((state: ProfileStore) => Partial<ProfileStore>),
	) => void,
	get: () => ProfileStore,
): Partial<ProfileStore> => ({
	// <--- Agregamos este tipado de retorno
	// ---------- setters ----------
	setActiveTab: (tab) => set({ activeTab: tab }), // TypeScript ahora sabe el tipo de 'tab'
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
			alert("Formato no soportado. Usa JPEG, PNG o WEBP.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			alert("La imagen no puede superar los 5MB.");
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
		} catch (err: any) {
			console.error("Error subiendo avatar:", err);
			alert(err.response?.data?.message || "Error al subir avatar");
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

			await get().refreshProfile(); // <-- await para poder normalizar después

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
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al actualizar avatar");
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

			// Actualizar AuthStore
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
		} catch (err: any) {
			if (err.response?.status === 403) {
				set({ showForcePasswordModal: true });
			} else {
				alert(err.response?.data?.message || "Error al desvincular");
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
				api.get("/friends/pending"),
				api.get("/friends/sent"),
			]);
			set({
				pendingReceived: receivedRes.data.data ?? [],
				pendingSent: sentRes.data.data ?? [],
				friendsLoading: false,
			});
		} catch {
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
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al enviar solicitud");
		} finally {
			set({ isSendingRequest: false });
		}
	},
	acceptRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/accept`);
			get().loadFriendRequests();
			get().refreshProfile();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al aceptar");
		}
	},
	rejectRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/reject`);
			get().loadFriendRequests();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al rechazar");
		}
	},
	cancelRequest: async (requestId) => {
		try {
			await api.post(`/friends/${requestId}/cancel`);
			get().loadFriendRequests();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al cancelar");
		}
	},
	removeFriend: async (friendId) => {
		try {
			await api.delete(`/friends/${friendId}`);
			get().refreshProfile();
			set({ showRemoveFriendModal: false });
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al eliminar amigo");
		}
	},
});

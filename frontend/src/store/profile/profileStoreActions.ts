import api from "../../api/axios";
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
		// El evento de HTML sí requiere tipo explícito
		const file = e.target.files?.[0];
		if (!file) return;
		set({ isUploading: true });
		try {
			const form = new FormData();
			form.append("avatar", file);
			const response = await api.post(`/users/${get().userId}/avatar`, form);

			// Actualizar AuthStore con el nuevo avatar
			const newAvatar = response.data.avatar || null;
			useAuthStore.getState().setAvatar(newAvatar);

			get().refreshProfile();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al subir avatar");
		} finally {
			set({ isUploading: false, showAvatarModal: false });
		}
	},

	handleSelectProviderAvatar: async (provider, avatarUrl) => {
		if (!avatarUrl) return;
		try {
			const response = await api.post(`/users/${get().userId}/avatar`, {
				provider,
				avatarUrl,
			});

			// Actualizar AuthStore con el nuevo avatar
			const newAvatar = response.data.avatar || null;
			useAuthStore.getState().setAvatar(newAvatar);

			get().refreshProfile();
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
			const res = await api.get("/friends/requests/pending");
			set({
				pendingReceived: res.data.received,
				pendingSent: res.data.sent,
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
			await api.post(`/friends/request/${userId}`);
			get().loadFriendRequests();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al enviar solicitud");
		} finally {
			set({ isSendingRequest: false });
		}
	},
	acceptRequest: async (requestId) => {
		try {
			await api.post(`/friends/accept/${requestId}`);
			get().loadFriendRequests();
			get().refreshProfile();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al aceptar");
		}
	},
	rejectRequest: async (requestId) => {
		try {
			await api.post(`/friends/reject/${requestId}`);
			get().loadFriendRequests();
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al rechazar");
		}
	},
	cancelRequest: async (requestId) => {
		try {
			await api.post(`/friends/cancel/${requestId}`);
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

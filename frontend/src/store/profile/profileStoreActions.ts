import api from "../../api/axios";
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
			await api.post(`/users/${get().userId}/avatar`, form);
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
			await api.put(`/users/${get().userId}/avatar`, { provider, avatarUrl });
			get().refreshProfile();
			set({ showAvatarModal: false });
		} catch (err: any) {
			alert(err.response?.data?.message || "Error al actualizar avatar");
		}
	},
	handleProviderClick: (provider) => {
		set({ providerToUnlink: provider, showUnlinkModal: true });
	},
	confirmUnlink: async () => {
		const { providerToUnlink, userId } = get();
		if (!providerToUnlink || !userId) return;
		try {
			await api.post(`/auth/unlink/${providerToUnlink}`);
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

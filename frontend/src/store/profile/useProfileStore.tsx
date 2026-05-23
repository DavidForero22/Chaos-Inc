import { createContext, useContext, useRef, useEffect } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { GameRecord } from "../../types/api";
import type { FriendRequest, UserRecord } from "../../types/user";
import type { ProfileStore } from "./profileStoreTypes";
import { createProfileActions } from "./profileStoreActions";
import { getFullAvatarUrl } from "../../utils/avatar";

// ---------- Contexto ----------
const ProfileStoreContext = createContext<StoreApi<ProfileStore> | null>(null);

// ---------- Provider ----------
interface ProfileProviderProps {
	userId: number | null;
	notMyProfile: boolean;
	games: GameRecord[];
	userRecord: UserRecord | null;
	pendingReceived?: FriendRequest[];
	pendingSent?: FriendRequest[];
	friendsLoading?: boolean;
	onLogout?: () => void;
	onDeleteAccount?: () => void;
	onUpdateProfile?: (data: any) => Promise<void>;
	refreshProfile: () => void;
	children: React.ReactNode;
}

export function ProfileProvider({
	userId,
	notMyProfile,
	games,
	userRecord,
	pendingReceived = [], // 🔥 Valor por defecto
	pendingSent = [], // 🔥 Valor por defecto
	friendsLoading = false, // 🔥 Valor por defecto
	onLogout,
	onDeleteAccount,
	onUpdateProfile,
	refreshProfile,
	children,
}: ProfileProviderProps) {
	const storeRef = useRef<StoreApi<ProfileStore> | null>(null);

	if (!storeRef.current) {
		storeRef.current = createStore<ProfileStore>((set, get) => ({
			userId,
			notMyProfile,
			games,
			userRecord: userRecord
				? { ...userRecord, avatar: getFullAvatarUrl(userRecord.avatar) }
				: null,
			pendingReceived, // 🔥 Inicializar
			pendingSent, // 🔥 Inicializar
			friendsLoading, // 🔥 Inicializar
			activeTab: "info",
			showAvatarModal: false,
			showUnlinkModal: false,
			showFriendRequestsModal: false,
			showRemoveFriendModal: false,
			showForcePasswordModal: false,
			providerToUnlink: null,
			unlinkPassword: "",
			unlinkPasswordError: "",
			isSendingRequest: false,
			isFriend: false,
			isUploading: false,
			showGalleryModal: false,
			onLogout,
			onDeleteAccount,
			onUpdateProfile,
			refreshProfile,
			...(createProfileActions(set, get) as any),
		}));
	}

	useEffect(() => {
		if (storeRef.current) {
			const normalized = userRecord
				? { ...userRecord, avatar: getFullAvatarUrl(userRecord.avatar) }
				: null;

			storeRef.current.setState({
				userId,
				notMyProfile,
				games,
				userRecord: normalized,
				pendingReceived, // 🔥 Actualizar
				pendingSent, // 🔥 Actualizar
				friendsLoading, // 🔥 Actualizar
				onLogout,
				onDeleteAccount,
				onUpdateProfile,
				refreshProfile,
			});
		}
	}, [
		userId,
		notMyProfile,
		games,
		userRecord,
		pendingReceived, // 🔥 Añadir a dependencias
		pendingSent, // 🔥 Añadir a dependencias
		friendsLoading, // 🔥 Añadir a dependencias
		onLogout,
		onDeleteAccount,
		onUpdateProfile,
		refreshProfile,
	]);

	return (
		<ProfileStoreContext.Provider value={storeRef.current}>
			{children}
		</ProfileStoreContext.Provider>
	);
}

export function useProfileStore<T>(selector: (state: ProfileStore) => T): T {
	const store = useContext(ProfileStoreContext);
	if (!store)
		throw new Error("useProfileStore debe usarse dentro de ProfileProvider");
	return useStore(store, selector);
}

import { createContext, useContext, useRef, useEffect } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import type { GameRecord } from "../../types/api";
import type { UserRecord } from "../../types/user";
import type { ProfileStore } from "./profileStoreTypes";
import { createProfileActions } from "./profileStoreActions";

// ---------- Contexto ----------
const ProfileStoreContext = createContext<StoreApi<ProfileStore> | null>(null);

// ---------- Provider ----------
interface ProfileProviderProps {
	userId: number | null;
	notMyProfile: boolean;
	games: GameRecord[];
	userRecord: UserRecord | null;
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
			userRecord,
			activeTab: "info",
			showAvatarModal: false,
			showUnlinkModal: false,
			showFriendRequestsModal: false,
			showRemoveFriendModal: false,
			showForcePasswordModal: false,
			providerToUnlink: null,
			unlinkPassword: "",
			unlinkPasswordError: "",
			pendingReceived: [],
			pendingSent: [],
			friendsLoading: false,
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
			storeRef.current.setState({
				userId,
				notMyProfile,
				games,
				userRecord,
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

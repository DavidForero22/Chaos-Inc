import type { GameRecord } from "../../types/api";
import type { UserRecord, FriendRequest } from "../../types/user";

export interface ProfilePageState {
	userId: number | null;
	notMyProfile: boolean;
	games: GameRecord[];
	userRecord: UserRecord | null;

	activeTab: "info" | "stats" | "history";

	showAvatarModal: boolean;
	showUnlinkModal: boolean;
	showFriendRequestsModal: boolean;
	showRemoveFriendModal: boolean;
	showForcePasswordModal: boolean;
	providerToUnlink: string | null;
	unlinkPassword: string;
	unlinkPasswordError: string;

	pendingReceived: FriendRequest[];
	pendingSent: FriendRequest[];
	friendsLoading: boolean;
	isSendingRequest: boolean;
	isFriend: boolean;

	isUploading: boolean;
	showGalleryModal: boolean;

	onLogout?: () => void;
	onDeleteAccount?: () => void;
	onUpdateProfile?: (data: any) => Promise<void>;
	refreshProfile: () => void;
}

export interface ProfilePageActions {
	setActiveTab: (tab: ProfilePageState["activeTab"]) => void;
	setShowAvatarModal: (v: boolean) => void;
	setShowUnlinkModal: (v: boolean) => void;
	setShowFriendRequestsModal: (v: boolean) => void;
	setShowRemoveFriendModal: (v: boolean) => void;
	setShowForcePasswordModal: (v: boolean) => void;
	setProviderToUnlink: (p: string | null) => void;
	setUnlinkPassword: (p: string) => void;
	setUnlinkPasswordError: (e: string) => void;

	handleAvatarClick: () => void;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleSelectProviderAvatar: (
		provider: string,
		avatarUrl: string | null,
	) => void;
	handleProviderClick: (provider: string, isLinked: boolean) => void;
	confirmUnlink: () => Promise<void>;
	closeForcePasswordModal: () => void;

	loadFriendRequests: () => Promise<void>;
	sendFriendRequest: () => Promise<void>;
	acceptRequest: (requestId: number) => Promise<void>;
	rejectRequest: (requestId: number) => Promise<void>;
	cancelRequest: (requestId: number) => Promise<void>;
	removeFriend: (friendId: number) => Promise<void>;

	setShowGalleryModal: (v: boolean) => void;
}

export type ProfileStore = ProfilePageState & ProfilePageActions;

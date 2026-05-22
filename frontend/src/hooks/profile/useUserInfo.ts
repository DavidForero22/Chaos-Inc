// src/hooks/profile/useUserInfo.ts

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { useAuthStore } from "../../store/auth/useAuthStore";
import api from "../../api/axios";
import type { SocialAccountInfo } from "../../types/user.ts";

interface UseUserInfoParams {
	userId?: number | null;
	notMyProfile: boolean;
	displayUser?: string | null;
	avatar?: string | null;
	socialAccounts?: SocialAccountInfo[] | null;
}

export function useUserInfo({
	userId,
	notMyProfile,
	displayUser,
	avatar: propAvatar,
	socialAccounts: propSocialAccounts,
}: UseUserInfoParams) {
	const { uploadAvatar } = useAuth();

	// Store values (fuente de verdad para perfil propio)
	const storeAvatar = useAuthStore((state) => state.avatar);
	const storeSocialAccounts = useAuthStore((state) => state.socialAccounts);

	const effectiveAvatar = notMyProfile
		? propAvatar
		: (storeAvatar ?? propAvatar);

	const effectiveSocialAccounts = notMyProfile
		? propSocialAccounts
		: (storeSocialAccounts ?? propSocialAccounts);

	// Estados locales para avatar (subida y modal)
	const [isUploading, setIsUploading] = useState(false);
	const [showAvatarModal, setShowAvatarModal] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const initials = displayUser
		? displayUser.substring(0, 2).toUpperCase()
		: "??";

	const avatarUrl = useMemo(() => {
		if (!effectiveAvatar) return null;
		if (effectiveAvatar.startsWith("http")) return effectiveAvatar;
		const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
		return `${backendUrl}/storage/${effectiveAvatar}`;
	}, [effectiveAvatar]);

	// Handlers de avatar
	const handleAvatarClick = () => {
		if (notMyProfile) return;
		if (effectiveSocialAccounts && effectiveSocialAccounts.length > 0) {
			setShowAvatarModal(true);
		} else {
			fileInputRef.current?.click();
		}
	};

	const handleManualUploadClick = () => {
		setShowAvatarModal(false);
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setIsUploading(true);
		await uploadAvatar(file);
		setIsUploading(false);
		if (e.target) e.target.value = "";
	};

	const handleSelectProviderAvatar = async (
		providerName: string,
		selectedAvatarUrl: string | null,
	) => {
		if (!userId) return;
		try {
			setIsUploading(true);
			setShowAvatarModal(false);
			await api.post(`/users/${userId}/avatar`, { provider: providerName });
			if (!notMyProfile) {
				useAuthStore.getState().setAvatar(selectedAvatarUrl);
			}
		} catch (error) {
			console.error("Error al actualizar avatar de proveedor:", error);
		} finally {
			setIsUploading(false);
		}
	};

	return {
		isUploading,
		showAvatarModal,
		setShowAvatarModal,
		fileInputRef,
		initials,
		avatarUrl,
		socialAccounts: effectiveSocialAccounts,
		handleAvatarClick,
		handleManualUploadClick,
		handleFileChange,
		handleSelectProviderAvatar,
	};
}
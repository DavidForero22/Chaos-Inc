// src/hooks/profile/useUserInfo.ts

import { useState, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../useAuth";
import { useAuthStore } from "../../store/useAuthStore";
import api from "../../api/axios";
import type { SocialAccountInfo } from "../../types/api";

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

	// ─── SUSCRIPCIÓN EN TIEMPO REAL AL STORE ───
	// Nos suscribirse a los valores del store. Si el store cambia, este hook forzará un re-render.
	const storeAvatar = useAuthStore((state) => state.avatar);
	const storeSocialAccounts = useAuthStore((state) => state.socialAccounts);

	console.log("socialAccounts: ", propSocialAccounts);
	console.log("storeSocialAccounts: ", storeSocialAccounts);

	// ─── FUENTE DE LA VERDAD ───
	// Si es perfil propio, la fuente de la verdad absoluta es el Store (así reacciona al instante).
	// pero si acaba de recargar la página y el store está vacío, caer en las props que trajo useUserProfileData.
	const effectiveAvatar = notMyProfile
		? propAvatar
		: (storeAvatar ?? propAvatar);

	const effectiveSocialAccounts = notMyProfile
		? propSocialAccounts
		: (storeSocialAccounts ?? propSocialAccounts);

	// Estados de subida y modal de avatar
	const [isUploading, setIsUploading] = useState(false);
	const [showAvatarModal, setShowAvatarModal] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Estados de desvinculación
	const [showUnlinkModal, setShowUnlinkModal] = useState(false);
	const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null);
	const [isUnlinking, setIsUnlinking] = useState(false);

	// Cálculos derivados
	const isDiscordLinked = effectiveSocialAccounts?.some(
		(acc) => acc.provider === "discord",
	);
	const isGoogleLinked = effectiveSocialAccounts?.some(
		(acc) => acc.provider === "google",
	);

	const initials = displayUser
		? displayUser.substring(0, 2).toUpperCase()
		: "??";

	const avatarUrl = useMemo(() => {
		if (!effectiveAvatar) return null;
		if (effectiveAvatar.startsWith("http")) return effectiveAvatar;
		const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
		return `${backendUrl}/storage/${effectiveAvatar}`;
	}, [effectiveAvatar]);

	// ─── HANDLERS DE AVATAR ───
	const handleAvatarClick = () => {
		if (notMyProfile) return;

		if (effectiveSocialAccounts && effectiveSocialAccounts.length > 0) {
			setShowAvatarModal(true);
		} else {
			fileInputRef.current?.click();
		}
	};

	const handleManualUploadClick = (e: React.FormEvent) => {
		e.preventDefault();
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

			// Esto actualizará el store, lo que disparará el 'storeAvatar' de arriba
			if (!notMyProfile) {
				useAuthStore.getState().setAvatar(selectedAvatarUrl);
			}
		} catch (error) {
			console.error("Error al actualizar avatar de proveedor:", error);
		} finally {
			setIsUploading(false);
		}
	};

	// ─── HANDLERS DE VINCULACIÓN / DESVINCULACIÓN ───
	const handleProviderClick = (
		providerName: string,
		isLinked: boolean | undefined,
	) => {
		if (notMyProfile) return;

		if (isLinked) {
			setProviderToUnlink(providerName);
			setShowUnlinkModal(true);
		} else {
			const rawUrl =
				import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
			const backendUrl = rawUrl.replace(/\/api\/v1\/?$/, "");
			window.location.href = `${backendUrl}/auth/${providerName}/redirect`;
		}
	};

	const confirmUnlink = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId || !providerToUnlink) return;

		try {
			setIsUnlinking(true);
			const res = await api.delete(
				`/users/${userId}/social/${providerToUnlink}`,
			);

			const updatedUser = res.data.user;

			// Esto disparará una actualización en 'storeSocialAccounts' y la UI cambiará al instante.
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

			setShowUnlinkModal(false);
			setProviderToUnlink(null);
		} catch (error) {
			console.error("Error al desvincular cuenta:", error);
			alert("Error al desvincular cuenta.");
		} finally {
			setIsUnlinking(false);
		}
	};

	return {
		isUploading,
		showAvatarModal,
		setShowAvatarModal,
		showUnlinkModal,
		setShowUnlinkModal,
		providerToUnlink,
		isUnlinking,
		fileInputRef,
		isDiscordLinked,
		isGoogleLinked,
		initials,
		avatarUrl,
		socialAccounts: effectiveSocialAccounts,
		handleAvatarClick,
		handleManualUploadClick,
		handleFileChange,
		handleSelectProviderAvatar,
		handleProviderClick,
		confirmUnlink,
	};
}

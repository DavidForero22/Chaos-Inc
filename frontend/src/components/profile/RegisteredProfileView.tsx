// src/components/profile/RegisteredProfileView.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/auth/useAuthStore";
import type { GameRecord } from "../../types/api";
import type { UserRecord } from "../../types/user";

import styles from "./RegisteredProfileView.module.css";

import UserInfo from ".//information/UserInfo";
import GraphsProfile from "./stats/GraphsProfile";
import GameHistory from "./history/GameHistory";

interface RegisteredProfileViewProps {
	games: GameRecord[];
	onLogout?: () => void;
	onDeleteAccount?: () => void;
	onUpdateProfile?: (data: any) => Promise<void>;
	notMyProfile?: boolean;
	publicProfile?: UserRecord | null;
	myProfile?: UserRecord | null;
	onRefreshProfile?: () => void;
}

export default function RegisteredProfileView({
	games,
	onLogout,
	onDeleteAccount,
	onUpdateProfile,
	notMyProfile = false,
	publicProfile = null,
	myProfile = null,
	onRefreshProfile,
}: RegisteredProfileViewProps) {
	const { id, user, role, avatar, socialAccounts, joinedAt } = useAuthStore();
	const [activeTab, setActiveTab] = useState<"info" | "stats" | "history">(
		"info",
	);

	// Referencias para los botones de pestaña
	const tabButtonsRef = useRef<{
		info: HTMLButtonElement | null;
		stats: HTMLButtonElement | null;
		history: HTMLButtonElement | null;
	}>({
		info: null,
		stats: null,
		history: null,
	});

	// Referencia para el contenido activo
	const activeContentRef = useRef<HTMLDivElement>(null);

	const displayId = notMyProfile ? publicProfile?.id : id;
	const displayUser = notMyProfile ? publicProfile?.username : user;
	const displayRole = notMyProfile ? publicProfile?.role : role;
	const displayJoinedAt = notMyProfile
		? publicProfile?.joinedAt
		: (myProfile?.joinedAt ?? joinedAt);
	const displayAvatar = notMyProfile ? publicProfile?.avatar : avatar;

	// Verificar si el perfil que miramos es el mismo perfil de quien lo ve
	const isActuallyMe = !notMyProfile && id === displayId;

	// Si es propio, priorizar los datos recién traídos de /users/{id} (myProfile)
	// Si falla, caer en el store. Si no es propio, SIEMPRE null.
	const displaySocialAccounts = isActuallyMe
		? myProfile?.socialAccounts || socialAccounts
		: null;

	const displayAchievements = notMyProfile
		? publicProfile?.achievements
		: myProfile?.achievements;

	const displayFriends = notMyProfile
		? publicProfile?.friends
		: myProfile?.friends;

	// Manejar navegación por teclado entre pestañas
	const handleTabKeyDown = (
		e: React.KeyboardEvent,
		tabId: "info" | "stats" | "history",
	) => {
		const tabs = ["info", "stats", "history"] as const;
		let nextTab: "info" | "stats" | "history" | null = null;

		if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault();
			const currentIndex = tabs.indexOf(tabId);

			if (e.key === "ArrowRight") {
				nextTab = tabs[(currentIndex + 1) % tabs.length];
			} else if (e.key === "ArrowLeft") {
				nextTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
			}

			if (nextTab) {
				setActiveTab(nextTab);
				tabButtonsRef.current[nextTab]?.focus();
				// Anunciar cambio de pestaña
				announceTabChange(nextTab);
			}
		} else if (e.key === "Home") {
			e.preventDefault();
			setActiveTab("info");
			tabButtonsRef.current.info?.focus();
			announceTabChange("info");
		} else if (e.key === "End") {
			e.preventDefault();
			setActiveTab("history");
			tabButtonsRef.current.history?.focus();
			announceTabChange("history");
		}
	};

	// Anunciar cambio de pestaña a lectores de pantalla
	const announceTabChange = (tab: "info" | "stats" | "history") => {
		const tabNames = {
			info: "Información del perfil",
			stats: "Estadísticas del jugador",
			history: "Historial de partidas",
		};

		const announcement = document.createElement("div");
		announcement.setAttribute("role", "status");
		announcement.setAttribute("aria-live", "polite");
		announcement.className = "sr-only";
		announcement.textContent = `Pestaña activa: ${tabNames[tab]}`;
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 2000);
	};

	// Enfocar el contenido cuando cambia la pestaña activa
	useEffect(() => {
		if (activeContentRef.current) {
			// Anunciar que el contenido ha cambiado
			const contentAnnouncement = document.createElement("div");
			contentAnnouncement.setAttribute("role", "status");
			contentAnnouncement.setAttribute("aria-live", "polite");
			contentAnnouncement.className = "sr-only";

			const contentNames = {
				info: "Mostrando información del perfil",
				stats: "Mostrando estadísticas y gráficos",
				history: "Mostrando historial de partidas",
			};

			contentAnnouncement.textContent = contentNames[activeTab];
			document.body.appendChild(contentAnnouncement);
			setTimeout(() => contentAnnouncement.remove(), 2000);
		}
	}, [activeTab]);

	// Anunciar el perfil al cargar
	useEffect(() => {
		const profileType = notMyProfile
			? `Perfil público de ${displayUser}`
			: "Mi perfil";
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "status");
		announcement.setAttribute("aria-live", "polite");
		announcement.className = "sr-only";
		announcement.textContent = `${profileType} cargado. Usa las flechas izquierda y derecha para navegar entre pestañas.`;
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 4000);
	}, [notMyProfile, displayUser]);

	return (
		<main
			className={styles.dossierContainer}
			aria-label={notMyProfile ? `Perfil de ${displayUser}` : "Mi perfil"}
		>
			<div
				className={styles.dossier}
				role="article"
				aria-labelledby="profile-heading"
			>
				<div
					className={`${styles.tape} ${styles.tapeTopLeft}`}
					aria-hidden="true"
				/>
				<div
					className={`${styles.tape} ${styles.tapeTopRight}`}
					aria-hidden="true"
				/>
				<div
					className={`${styles.tape} ${styles.tapeBottomLeft}`}
					aria-hidden="true"
				/>
				<div
					className={`${styles.tape} ${styles.tapeBottomRight}`}
					aria-hidden="true"
				/>

				<div className={styles.topSecretHeader} role="banner">
					<span>CHAOS INC. // DPTO. RECURSOS HUMANOS</span>
				</div>

				<div
					className={styles.navMenu}
					role="tablist"
					aria-label="Navegación del perfil"
				>
					<button
						ref={(el) => {
							tabButtonsRef.current.info = el;
						}}
						role="tab"
						id="tab-info"
						aria-selected={activeTab === "info"}
						aria-controls="panel-info"
						className={`${styles.navBtn} ${activeTab === "info" ? styles.navBtnActive : ""}`}
						onClick={() => {
							setActiveTab("info");
							announceTabChange("info");
						}}
						onKeyDown={(e) => handleTabKeyDown(e, "info")}
						tabIndex={activeTab === "info" ? 0 : -1}
					>
						[INFORMACIÓN]
					</button>
					<button
						ref={(el) => {
							tabButtonsRef.current.stats = el;
						}}
						role="tab"
						id="tab-stats"
						aria-selected={activeTab === "stats"}
						aria-controls="panel-stats"
						className={`${styles.navBtn} ${activeTab === "stats" ? styles.navBtnActive : ""}`}
						onClick={() => {
							setActiveTab("stats");
							announceTabChange("stats");
						}}
						onKeyDown={(e) => handleTabKeyDown(e, "stats")}
						tabIndex={activeTab === "stats" ? 0 : -1}
					>
						[ESTADÍSTICAS]
					</button>
					<button
						ref={(el) => {
							tabButtonsRef.current.history = el;
						}}
						role="tab"
						id="tab-history"
						aria-selected={activeTab === "history"}
						aria-controls="panel-history"
						className={`${styles.navBtn} ${activeTab === "history" ? styles.navBtnActive : ""}`}
						onClick={() => {
							setActiveTab("history");
							announceTabChange("history");
						}}
						onKeyDown={(e) => handleTabKeyDown(e, "history")}
						tabIndex={activeTab === "history" ? 0 : -1}
					>
						[HISTORIAL]
					</button>
				</div>

				<div className={styles.divider} role="separator" aria-hidden="true" />

				<div className={styles.sectionsWrapper} ref={activeContentRef}>
					<div
						id="panel-info"
						role="tabpanel"
						aria-labelledby="tab-info"
						hidden={activeTab !== "info"}
						tabIndex={activeTab === "info" ? 0 : -1}
					>
						{activeTab === "info" && (
							<UserInfo
								userId={Number(displayId)}
								notMyProfile={notMyProfile}
								userRecord={notMyProfile ? publicProfile : myProfile}
								displayUser={displayUser}
								displayRole={displayRole}
								displayJoinedAt={displayJoinedAt}
								avatar={displayAvatar}
								socialAccounts={displaySocialAccounts}
								achievements={displayAchievements}
								friends={displayFriends}
								onLogout={onLogout}
								onDeleteAccount={onDeleteAccount}
								onUpdateProfile={onUpdateProfile}
								onRefreshProfile={onRefreshProfile}
							/>
						)}
					</div>

					<div
						id="panel-stats"
						role="tabpanel"
						aria-labelledby="tab-stats"
						hidden={activeTab !== "stats"}
						tabIndex={activeTab === "stats" ? 0 : -1}
					>
						{activeTab === "stats" && (
							<GraphsProfile games={games} user={displayUser} />
						)}
					</div>

					<div
						id="panel-history"
						role="tabpanel"
						aria-labelledby="tab-history"
						hidden={activeTab !== "history"}
						tabIndex={activeTab === "history" ? 0 : -1}
					>
						{activeTab === "history" && (
							<GameHistory games={games} user={displayUser} />
						)}
					</div>
				</div>
			</div>
		</main>
	);
}

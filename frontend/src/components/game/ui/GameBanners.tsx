// src/components/game/ui/GameBanners.tsx

import { useState, useEffect } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useAuth } from "../../../hooks/useAuth.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import styles from "./GameBanners.module.css";

interface GameBannersProps {
	showBossWaiting: boolean;
	showActingBossWaiting: boolean;
	showEndingWaiting: boolean;
	showInheritanceBanner: boolean;
	playerPendingSabotage?: string | null;
}

// Componente auxiliar para que el banner espere a la animación antes de desaparecer
function AnimatedBanner({
	show,
	message,
	colorClass = "",
}: {
	show: boolean;
	message: string;
	colorClass?: string;
}) {
	const [shouldRender, setShouldRender] = useState(show);
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		if (show) {
			setShouldRender(true);
			setIsExiting(false);
		} else if (shouldRender) {
			// Empezar la animación de salida
			setIsExiting(true);
			// 300ms es el tiempo que dura la animación CSS (pullUp)
			const timer = setTimeout(() => {
				setShouldRender(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [show, shouldRender]);

	if (!shouldRender) return null;

	return (
		<div
			className={`${styles.shoutRow} ${isExiting ? styles.slideOutTop : styles.slideInTop}`}
		>
			<div className={styles.megaphone}>📢</div>
			<div className={`${styles.shoutBubble} ${colorClass}`}>{message}</div>
		</div>
	);
}

export function GameBanners({
	showBossWaiting,
	showActingBossWaiting,
	showEndingWaiting,
	showInheritanceBanner,
	playerPendingSabotage,
}: GameBannersProps) {
	const gameData = useGameStore((state) => state.gameData);
	const { user } = useAuth();
	const luckResult = useGameUIStore((state) => state.luckResult);

	if (!gameData) return null;
	const { game } = gameData;

	const isSomeoneElseDefendingSingle = !!(
		game.pending_single_attack_target &&
		game.pending_single_attack_target !== user
	);

	const isSomeoneElseDefendingMulti =
		game.pending_multi_attack_targets.length > 0 &&
		!game.pending_multi_attack_targets.includes(user || "");

	const isSomeoneElseInLuckChallenge = !!(
		game.player_in_luck_challenge &&
		game.player_in_luck_challenge !== user
	);

	return (
		<div className={styles.bannersContainer}>
			{/* NUEVOS BANNERS INFORMATIVOS */}
			<AnimatedBanner
				show={isSomeoneElseDefendingSingle}
				message={`¡${game.pending_single_attack_target} ESTÁ DECIDIENDO SI ASUMIR EL ATAQUE!`}
				colorClass={styles.bgNotice}
			/>

			<AnimatedBanner
				show={isSomeoneElseDefendingMulti}
				message={`¡ALERTA! ¡ATAQUE MASIVO EN CURSO EN LA OFICINA!`}
				colorClass={styles.bgAlert}
			/>

			<AnimatedBanner
				show={isSomeoneElseInLuckChallenge}
				message={`¡${game.player_in_luck_challenge} INTENTA ESCAPAR DEL BLOQUEO DE RRHH!`}
				colorClass={styles.bgNotice}
			/>

			<AnimatedBanner
				show={showActingBossWaiting}
				message={`¡EL JEFE EN FUNCIONES NO RESPONDE! ESPERANDO RECONEXIÓN...`}
			/>

			<AnimatedBanner
				show={showBossWaiting}
				message={`¡EL JEFE SE HA DESCONECTADO! ESPERANDO SUCESIÓN...`}
			/>

			<AnimatedBanner
				show={showInheritanceBanner}
				message={`¡EL TIEMPO EXPIRÓ! ALGUIEN HA HEREDADO EL CARGO EN SECRETO.`}
			/>

			<AnimatedBanner
				show={showEndingWaiting}
				message={`¡LA PARTIDA SE CANCELARÁ POR ABANDONO EN 10 SEGUNDOS!`}
				colorClass={styles.bgCritical}
			/>

			<AnimatedBanner
				show={
					!!(playerPendingSabotage && playerPendingSabotage !== user)
				}
				message={`¡${playerPendingSabotage} ESTÁ SIENDO OBLIGADO A DESCARTAR!`}
				colorClass={styles.bgNotice}
			/>

			<AnimatedBanner
				show={!!luckResult}
				message={
					luckResult === "success"
						? "¡ACERTASTE EL DESAFÍO! ¡VUELVES AL TRABAJO!"
						: "¡FALLASTE EL DESAFÍO! ¡TURNO PERDIDO!"
				}
				colorClass={
					luckResult === "success" ? styles.bgSuccess : styles.bgCritical
				}
			/>
		</div>
	);
}

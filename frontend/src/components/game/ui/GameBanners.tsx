// src/components/game/ui/GameBanners.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect } from "react";
import { useGameStore } from "../../../store/game/useGameStore.ts";
import { useAuth } from "../../../hooks/auth/useAuth.ts";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";
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
	isAlert = false, // Permite distinguir entre alertas críticas y notificaciones
}: {
	show: boolean;
	message: string;
	colorClass?: string;
	isAlert?: boolean;
}) {
	const [shouldRender, setShouldRender] = useState(show);
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		if (show) {
			setShouldRender(true);
			setIsExiting(false);
		} else if (shouldRender) {
			setIsExiting(true);
			const timer = setTimeout(() => {
				setShouldRender(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [show, shouldRender]);

	if (!shouldRender) return null;

	return (
		<div
			// --- ACCESIBILIDAD: Live Region dinámica ---
			role={isAlert ? "alert" : "status"}
			aria-live={isAlert ? "assertive" : "polite"}
			className={`${styles.shoutRow} ${isExiting ? styles.slideOutTop : styles.slideInTop}`}
		>
			{/* Ocultar el emoji al lector de pantalla */}
			<div className={styles.megaphone} aria-hidden="true">
				📢
			</div>
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
	const { id: myId } = useAuth();
	const luckResult = useGameUIStore((state) => state.luckResult);

	if (!gameData) return null;
	const { game, me } = gameData;

	const getName = (id: string | null | undefined) => {
		if (!id) return "Alguien";
		if (String(id) === String(myId)) return me.name;
		const opponent = game.opponents.find((o) => String(o.id) === String(id));
		return opponent ? opponent.name : `Jugador ${id}`;
	};

	const isSomeoneElseDefendingSingle = !!(
		game.pending_single_attack_target &&
		String(game.pending_single_attack_target) !== String(myId)
	);

	const isSomeoneElseDefendingMulti =
		game.pending_multi_attack_targets.length > 0 &&
		!game.pending_multi_attack_targets.some(
			(id) => String(id) === String(myId),
		);

	const isSomeoneElseInLuckChallenge = !!(
		game.player_in_luck_challenge &&
		String(game.player_in_luck_challenge) !== String(myId)
	);

	const isSomeoneElsePendingSabotage = !!(
		playerPendingSabotage && String(playerPendingSabotage) !== String(myId)
	);

	return (
		<section
			aria-label="Anuncios de la partida"
			className={styles.bannersContainer}
		>
			<AnimatedBanner
				show={isSomeoneElseDefendingSingle}
				message={`¡${getName(game.pending_single_attack_target)} ESTÁ DECIDIENDO SI ASUMIR EL ATAQUE!`}
				colorClass={styles.bgNotice}
			/>

			<AnimatedBanner
				show={isSomeoneElseDefendingMulti}
				message={`¡ALERTA! ¡ATAQUE MASIVO EN CURSO EN LA OFICINA!`}
				colorClass={styles.bgAlert}
				isAlert={true} // Urgente
			/>

			<AnimatedBanner
				show={isSomeoneElseInLuckChallenge}
				message={`¡${getName(game.player_in_luck_challenge)} INTENTA ESCAPAR DEL BLOQUEO DE RRHH!`}
				colorClass={styles.bgNotice}
			/>

			<AnimatedBanner
				show={showActingBossWaiting}
				message={`¡EL JEFE EN FUNCIONES NO RESPONDE! ESPERANDO RECONEXIÓN...`}
				isAlert={true} // Urgente
			/>

			<AnimatedBanner
				show={showBossWaiting}
				message={`¡EL JEFE SE HA DESCONECTADO! ESPERANDO SUCESIÓN...`}
				isAlert={true} // Urgente
			/>

			<AnimatedBanner
				show={showInheritanceBanner}
				message={`¡EL TIEMPO EXPIRÓ! ALGUIEN HA HEREDADO EL CARGO EN SECRETO.`}
				isAlert={true} // Urgente
			/>

			<AnimatedBanner
				show={showEndingWaiting}
				message={`¡LA PARTIDA SE CANCELARÁ POR ABANDONO EN 10 SEGUNDOS!`}
				colorClass={styles.bgCritical}
				isAlert={true} // Súper urgente
			/>

			<AnimatedBanner
				show={isSomeoneElsePendingSabotage}
				message={`¡${getName(playerPendingSabotage)} ESTÁ SIENDO OBLIGADO A DESCARTAR!`}
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
				isAlert={true} // Resultado crítico de tu acción
			/>
		</section>
	);
}

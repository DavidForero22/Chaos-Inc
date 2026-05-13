// src/components/game/GameOverModal.tsx

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./GameOverModal.module.css";
import { RESULT_CONFIG, ROLE_LABELS } from "../../../data/gameResults.ts";
import type { WinnerRole, ConfigKey } from "../../../data/gameResults.ts";
import { useGameStore } from "../../../store/useGameStore.ts";
import { ACHIEVEMENTS } from "../../../data/achievements.ts";
import type { PlayerRole } from "../../../types/live-game.ts";

interface GameOverModalProps {
	winnerRole: WinnerRole;
	myRole: PlayerRole;
	onClose: () => void;
}

export function GameOverModal({
	winnerRole,
	myRole,
	onClose,
}: GameOverModalProps) {
	const exitButtonRef = useRef<HTMLButtonElement>(null);

	// Resolver configuración
	const configKey: ConfigKey =
		winnerRole === "canceled" || !winnerRole ? "canceled" : winnerRole;
	const config = RESULT_CONFIG[configKey];

	// Calcular estados
	const iWon = config.winners.includes(myRole);
	const isCancelled = configKey === "canceled";

	// Logros desbloqueados en esta partida (solo del jugador)
	const matchAchievements = useGameStore((s) => s.matchAchievements);
	const achievementItems = matchAchievements
		.map((id) => ACHIEVEMENTS.find((a) => a.id === id))
		.filter(Boolean);

	// Obtener la fecha actual para el periódico
	const today = new Date().toLocaleDateString("es-ES", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	useEffect(() => {
		const timer = setTimeout(() => {
			exitButtonRef.current?.focus();
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return createPortal(
		<div
			className={styles.overlay}
			role="dialog"
			aria-modal="true"
			aria-labelledby="gameover-headline"
		>
			{/* EL PERIÓDICO */}
			<div className={styles.newspaper}>
				{/* Cabecera del Periódico */}
				<div className={styles.masthead} aria-hidden="true">
					<h1 className={styles.newspaperName}>LA Agencia Preguntas</h1>
				</div>

				<span className="sr-only">Noticia de fin de partida.</span>

				<div className={styles.subhead} aria-hidden="true">
					<span>Edición Especial de Cierre</span>
					<span>{today}</span>
					<span>GRATUITO</span>
				</div>

				<h2 id="gameover-headline" className={styles.headline}>
					{config.headline}
				</h2>

				{/* Gran Imagen Central con Subtítulo */}
				<div className={styles.photoWrapper}>
					<img
						src={config.image}
						alt={`Ilustración del resultado: ${config.headline}`}
						className={styles.photoImage}
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
					{/* El pie de foto estilo periódico */}
					{config.subtitle && (
						<p className="text-sm italic text-gray-700 mt-2 mb-4 text-center border-b border-gray-300 pb-2 font-serif">
							{config.subtitle}
						</p>
					)}
				</div>

				{/* Cuerpo de la Noticia */}
				<div className={styles.articleBody}>
					<p>{config.description}</p>

					{!isCancelled && (
						<div className="mt-6 border-t-2 border-black pt-4">
							<strong>FACCIONES VICTORIOSAS:</strong>
							<ul
								className="list-disc pl-5 mt-2"
								aria-label="Lista de facciones ganadoras"
							>
								{config.winners.map((role) => (
									<li key={role} className="font-bold">
										{ROLE_LABELS[role]}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* Logros obtenidos en la partida (se muestran siempre si existen) */}
				{achievementItems.length > 0 && (
					<div className={styles.achievementsSection}>
						<h3 className={styles.achievementsTitle}>Logros obtenidos</h3>
						{/* ACCESIBILIDAD: Convertido a <ul> para anunciar cantidad de logros */}
						<ul
							className={styles.achievementsGrid}
							aria-label="Logros desbloqueados en esta partida"
						>
							{achievementItems.map((ach) => (
								<li key={ach!.id} className={styles.medalCard}>
									<div className={styles.medalRing}>
										<img
											src={ach!.image}
											alt=""
											aria-hidden="true"
											className={styles.medalImage}
										/>
									</div>
									<div className={styles.medalText}>
										<p className={styles.medalTitle}>{ach!.title}</p>
										<p className={styles.medalDesc}>
											{ach!.technicalDescription}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Resultado Personal */}
				{!isCancelled && (
					<div
						className={`${styles.finalResult} ${iWon ? styles.textWon : styles.textLost}`}
						role="alert"
						aria-live="assertive"
					>
						{iWon ? "¡HAS GANADO!" : "¡HAS PERDIDO!"}
					</div>
				)}

				{/* Botón Inferior para volver */}
				<button
					ref={exitButtonRef}
					onClick={onClose}
					className={`${styles.exitButton} focus:outline-none focus:ring-4 focus:ring-black focus:ring-offset-2 focus:ring-offset-[#fdfbf2]`}
					aria-label="Cerrar resultados y volver al menú principal"
				>
					Volver al Menú Principal
				</button>
			</div>
		</div>,
		document.body,
	);
}

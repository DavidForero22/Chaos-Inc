// src/components/game/GameOverModal.tsx
// Accesibilidad comprobada: SI

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./GameOverModal.module.css";
import { RESULT_CONFIG } from "../../../../data/game/gameResults.ts";
import type {
	WinnerRole,
	ConfigKey,
} from "../../../../data/game/gameResults.ts";
import { useGameUIStore } from "../../../../store/game/useGameUIStore.ts";
import { ACHIEVEMENTS } from "../../../../data/app/achievements.ts";
import type { PlayerRole } from "../../../../types/live-game.ts";
import { ROLE_LABELS } from "../../../../data/game/roles.ts";
import { useGameStore } from "../../../../store/game/useGameStore.ts";
import { XpSummaryCard } from "./XPSummaryCard.tsx";

interface GameOverModalProps {
	winnerRole: WinnerRole;
	myRole: PlayerRole;
	isActingBoss: boolean;
	onClose: () => void;
}

export function GameOverModal({
	winnerRole,
	myRole,
	isActingBoss,
	onClose,
}: GameOverModalProps) {
	const headlineRef = useRef<HTMLHeadingElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showArrow, setShowArrow] = useState(false);
	const xpSummary = useGameStore((s) => s.xpSummary);

	// Resolver configuración
	const configKey: ConfigKey =
		winnerRole === "canceled" || !winnerRole ? "canceled" : winnerRole;
	const config = RESULT_CONFIG[configKey];

	// Calcular estados
	const effectiveRole = isActingBoss ? "boss" : myRole;
	const iWon = config.winners.includes(effectiveRole);
	const isCancelled = configKey === "canceled";

	// Logros desbloqueados en esta partida (solo del jugador)
	const matchAchievements = useGameUIStore((s) => s.matchAchievements);
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

	// --- GESTIÓN DE FOCO ---
	useEffect(() => {
		const timer = setTimeout(() => {
			headlineRef.current?.focus({ preventScroll: true });
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	// --- LÓGICA DE SCROLL Y FLECHA MEJORADA ---
	const checkScroll = () => {
		if (scrollRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
			// Mostramos la flecha si falta más de 50px para llegar al final
			const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 50;
			setShowArrow(scrollHeight > clientHeight + 10 && !isBottom);
		}
	};

	const handleScroll = () => {
		checkScroll();
	};

	// Comprobar desbordamiento (con soporte para carga de imágenes)
	useEffect(() => {
		checkScroll(); // Primera comprobación

		// Segunda comprobación poco después, para cuando las imágenes hayan renderizado
		const timer = setTimeout(checkScroll, 300);

		// ResizeObserver para detectar si la ventana cambia de tamaño
		const observer = new ResizeObserver(() => checkScroll());
		if (scrollRef.current) {
			observer.observe(scrollRef.current);
		}

		return () => {
			clearTimeout(timer);
			observer.disconnect();
		};
	}, [achievementItems.length]);

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
			<div
				className={`${styles.newspaper} max-w-4xl px-6 md:px-12`}
				ref={scrollRef}
				onScroll={handleScroll}
				tabIndex={-1}
			>
				{/* Cabecera del Periódico */}
				<div className={styles.masthead} aria-hidden="true">
					<h1 className={styles.newspaperName}>LA Agencia Preguntas</h1>
				</div>

				<span className="sr-only">
					Noticia de fin de partida: {config.headline}
				</span>

				<div className={styles.subhead} aria-hidden="true">
					<span>Edición Especial de Cierre</span>
					<span>{today}</span>
					<span>GRATUITO</span>
				</div>

				<h2
					id="gameover-headline"
					ref={headlineRef}
					tabIndex={-1}
					className={`${styles.headline} focus:outline-none`}
				>
					{config.headline}
				</h2>

				{/* Gran Imagen Central con Subtítulo */}
				<div className={styles.photoWrapper}>
					<img
						src={config.image}
						alt={`Ilustración del resultado: ${config.headline}`}
						className={styles.photoImage}
						onLoad={checkScroll} // Recalcular la flecha cuando la imagen cargue
					/>
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

				{/* Logros obtenidos */}
				{achievementItems.length > 0 && (
					<div className={styles.achievementsSection}>
						<h3 className={styles.achievementsTitle}>Logros obtenidos</h3>
						<ul
							className={styles.achievementsGrid}
							aria-label="Logros desbloqueados"
						>
							{achievementItems.map((ach) => (
								<li key={ach!.id} className={styles.medalCard}>
									<div className={styles.medalRing}>
										<img
											src={ach!.image}
											alt=""
											aria-hidden="true"
											className={styles.medalImage}
											onLoad={checkScroll} // Recalcular cuando la medalla cargue
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

						<XpSummaryCard summary={xpSummary} hasWon={iWon} />
					</div>
				)}

				<button
					onClick={onClose}
					className={`${styles.exitButton} focus:outline-none focus-visible:ring-4 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfbf2]`}
					aria-label="Cerrar resultados y volver al menú principal"
				>
					Volver al Menú Principal
				</button>
			</div>

			{/* FLECHA INDICADORA */}
			<div
				className={`${styles.arrow} ${showArrow ? styles.arrowVisible : styles.arrowHidden}`}
				aria-hidden="true"
			>
				<svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
					{/* Flecha sólida estilo tipográfico con remates marcados */}
					<path d="M12 21l-9-9h5v-9h8v9h5z" />
				</svg>
			</div>
		</div>,
		document.body,
	);
}

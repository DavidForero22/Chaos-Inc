// src/components/game/GameOverModal.tsx

import { createPortal } from "react-dom";
import styles from "./GameOverModal.module.css";

type WinnerRole = "boss" | "union" | "intern" | "canceled" | null;
type PlayerRole = "boss" | "secretary" | "intern" | "union";
type ConfigKey = "boss" | "union" | "intern" | "canceled";

// Expandimos la configuración para el diseño de Periódico
const RESULT_CONFIG: Record<
	ConfigKey,
	{
		headline: string;
		image: string;
		description: string;
		winners: PlayerRole[];
	}
> = {
	boss: {
		headline: "¡LA DIRECCIÓN APLASTA LA REBELIÓN!",
		image: "/placeholder_news_boss.jpg", // Usa las rutas que tengas preparadas
		description:
			"En un giro dramático de los acontecimientos, la cúpula directiva de Chaos Inc. ha logrado desmantelar la célula sindical que operaba en las sombras de la oficina. Se reportan despidos masivos y la instauración de una nueva política de 'cero tolerancia'. El orden corporativo ha sido restaurado.",
		winners: ["boss", "secretary"],
	},
	union: {
		headline: "¡EL SINDICATO TOMA EL CONTROL!",
		image: "/placeholder_news_union.jpg",
		description:
			"Histórico motín en Chaos Inc. Tras una intensa jornada de sabotajes y papeleo extraviado, el Director General ha sido destituido. Las fuerzas sindicales han tomado las riendas de la compañía prometiendo máquinas de café gratuitas y el fin de las horas extra obligatorias.",
		winners: ["union"],
	},
	intern: {
		headline: "¡UN BECARIO SE CORONA COMO CEO!",
		image: "/placeholder_news_intern.jpg",
		description:
			"Lo que parecía una jornada de fotocopias rutinaria ha terminado con el ascenso más meteórico de la historia corporativa. Aprovechando el fuego cruzado entre la directiva y los sindicatos, un empleado en prácticas no remunerado ha usurpado el puesto de máxima autoridad.",
		winners: ["intern"],
	},
	canceled: {
		headline: "CIERRE PATRONAL INDEFINIDO",
		image: "/placeholder_news_canceled.jpg",
		description:
			"Las autoridades han clausurado el edificio. Múltiples abandonos en puestos clave han provocado el colapso organizativo de Chaos Inc. La partida ha sido anulada por incomparecencia de los trabajadores. No hay vencedores, solo papeleo sin rellenar.",
		winners: [],
	},
};

const ROLE_LABELS: Record<PlayerRole, string> = {
	boss: "Director General",
	secretary: "Secretariado",
	intern: "Becario",
	union: "Enlace Sindical",
};

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
	// Resolver configuración
	const configKey: ConfigKey =
		winnerRole === "canceled" || !winnerRole ? "canceled" : winnerRole;
	const config = RESULT_CONFIG[configKey];

	// Calcular estados
	const iWon = config.winners.includes(myRole);
	const isCancelled = configKey === "canceled";

	// Obtener la fecha actual para el periódico
	const today = new Date().toLocaleDateString("es-ES", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return createPortal(
		<div className={styles.overlay}>
			{/* EL PERIÓDICO */}
			<div className={styles.newspaper}>
				{/* Cabecera del Periódico */}
				<div className={styles.masthead}>
					<h1 className={styles.newspaperName}>The Chaos Chronicle</h1>
				</div>
				<div className={styles.subhead}>
					<span>Edición Especial de Cierre</span>
					<span>{today}</span>
					<span>GRATUITO</span>
				</div>

				{/* Titular Principal */}
				<h2 className={styles.headline}>{config.headline}</h2>

				{/* Gran Imagen Central */}
				<div className={styles.photoWrapper}>
					<img
						src={config.image}
						alt="Foto del evento"
						className={styles.photoImage}
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
				</div>

				{/* Sello de Resultado Personal (Si no ha sido cancelada) */}
				{!isCancelled && (
					<div
						className={`${styles.resultStamp} ${iWon ? styles.stampWon : styles.stampLost}`}
					>
						{iWon ? "ASCENDIDO" : "DESPEDIDO"}
					</div>
				)}

				{/* Cuerpo de la Noticia */}
				<div className={styles.articleBody}>
					<p>
						<strong>MADRID —</strong> {config.description}
					</p>

					{!isCancelled && (
						<div className="mt-6 border-t-2 border-black pt-4">
							<strong>FACCIONES VICTORIOSAS RECONOCIDAS:</strong>
							<ul className="list-disc pl-5 mt-2">
								{config.winners.map((role) => (
									<li key={role} className="font-bold">
										{ROLE_LABELS[role]}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* Botón Inferior para volver (Como un anuncio en el periódico) */}
				<button onClick={onClose} className={styles.exitButton}>
					Volver a Recepción (Menú Principal)
				</button>
			</div>
		</div>,
		document.body,
	);
}

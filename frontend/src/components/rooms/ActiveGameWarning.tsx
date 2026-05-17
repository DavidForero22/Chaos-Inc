// Accesibilidad comprobada: SI

import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import styles from "./ActiveGameWarning.module.css";



interface ActiveGameWarningProps {
	roomId: string;
}

export default function ActiveGameWarning({ roomId }: ActiveGameWarningProps) {
	const navigate = useNavigate();
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Enfocar el botón automáticamente cuando aparece el warning
	useEffect(() => {
		if (buttonRef.current) {
			buttonRef.current.focus();
		}

		// Anunciar el warning a lectores de pantalla
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "alert");
		announcement.setAttribute("aria-live", "assertive");
		announcement.className = "sr-only";
		announcement.textContent =
			"Advertencia: Ya estás dentro de una sala activa. Puedes volver a la sala presionando el botón.";
		document.body.appendChild(announcement);

		return () => {
			announcement.remove();
		};
	}, []);

	const handleReturnToRoom = () => {
		// Anunciar la acción antes de navegar
		const announcement = document.createElement("div");
		announcement.setAttribute("role", "status");
		announcement.setAttribute("aria-live", "polite");
		announcement.className ="sr-only";
		announcement.textContent = "Volviendo a la sala";
		document.body.appendChild(announcement);
		setTimeout(() => announcement.remove(), 1000);

		navigate(`/rooms/${roomId}`);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			handleReturnToRoom();
		}
	};

	return (
		<div
			className={styles.warningContainer}
			role="alert"
			aria-live="assertive"
			aria-labelledby="warning-title"
			aria-describedby="warning-subtitle"
		>
			<div className={styles.warningText}>
				<span
					className={styles.icon}
					aria-hidden="true"
					role="img"
					aria-label="Advertencia"
				>
					⚠️
				</span>
				<div>
					<p id="warning-title" className={styles.title}>
						Sala Activa
					</p>
					<p id="warning-subtitle" className={styles.subtitle}>
						Ya te encuentras dentro de una sala.
					</p>
				</div>
			</div>
			<button
				ref={buttonRef}
				onClick={handleReturnToRoom}
				onKeyDown={handleKeyDown}
				className={styles.returnBtn}
				aria-label="Volver a la sala activa"
			>
				Volver a la sala
			</button>
		</div>
	);
}

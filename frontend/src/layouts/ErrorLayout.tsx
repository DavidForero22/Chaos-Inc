// Accesibilidad comprobada: SI

import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "./ErrorLayout.module.css";

interface ErrorLayoutProps {
	title: string;
	description: ReactNode;
	subtitle: string;
	buttonText?: string;
	returnPath?: string;
}

export default function ErrorLayout({
	title,
	description,
	subtitle,
	buttonText = "Volver al puesto de trabajo",
	returnPath = "/",
}: ErrorLayoutProps) {
	return (
		<div
			className={styles.wallBackground}
			role="main"
			aria-label="Página de error"
		>
			<div className={styles.paper}>
				{/* La Cinta Adhesiva (Celofán realista) - Decorativa */}
				<div className={styles.tape} aria-hidden="true" role="presentation" />

				<div className={styles.content}>
					{/* Icono decorativo */}
					<FiAlertTriangle className={styles.icon} aria-hidden="true" />

					{/* Etiqueta semántica de estado */}
					<p className={styles.stamp} aria-label="Tipo de comunicación">
						Comunicado Oficial
					</p>

					{/* Título principal del error */}
					<h1 className={styles.title}>{title}</h1>

					{/* Descripción del error */}
					<div
						className={styles.descriptionBox}
						role="status"
						aria-live="polite"
					>
						<p>{description}</p>
						<p className={styles.subtitle}>{subtitle}</p>
					</div>

					{/* Botón de acción principal */}
					<Link
						to={returnPath}
						className={styles.button}
						aria-label={buttonText}
					>
						{buttonText}
					</Link>
				</div>
			</div>
		</div>
	);
}

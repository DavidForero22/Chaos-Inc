// src/layouts/ErrorLayout.tsx
// Accesibilidad comprobada: SI

import { Link } from "react-router-dom";
import type { ReactNode } from "react";
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
			className={styles.sceneBackground}
			role="main"
			aria-label="Página de error"
		>
			<div className={styles.sign3dContainer}>
				<div className={styles.signBoard}>
					<div className={styles.handleWrapper}>
						<div className={styles.handle}></div>
					</div>

					<div className={styles.contentBody}>
						<p className={styles.cautionText}>CUIDADO</p>

						<h1 className={styles.title}>{title}</h1>

						<div className={styles.triangleContainer}>
							<svg
								viewBox="0 0 100 90"
								className={styles.triangleSvg}
								aria-hidden="true"
							>
								<polygon
									points="50,10 90,80 10,80"
									className={styles.trianglePolygon}
								/>
							</svg>
							<div className={styles.iconOverlay}>
								<span className={styles.fallbackIcon} aria-hidden="true">
									!
								</span>
							</div>
						</div>

						<div
							className={styles.descriptionBox}
							role="status"
							aria-live="polite"
						>
							<p className={styles.mainDescription}>{description}</p>
							<p className={styles.subtitle}>{subtitle}</p>
						</div>

						<Link
							to={returnPath}
							className={styles.button}
							aria-label={buttonText}
						>
							{buttonText}
						</Link>
					</div>
				</div>

				<div className={styles.floorShadow}></div>
			</div>
		</div>
	);
}

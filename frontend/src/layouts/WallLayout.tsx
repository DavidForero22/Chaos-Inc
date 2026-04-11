// src/layouts/WallLayout.tsx

import type { ReactNode } from "react";
import styles from "./WallLayout.module.css";

interface WallLayoutProps {
	children: ReactNode;
	boardWidth?: string;
}

export default function WallLayout({
	children,
	boardWidth = "800px",
}: WallLayoutProps) {
	return (
		<div className={styles.wallBackground}>
			{/* El armazón con el marco de aluminio */}
			<div className={styles.boardFrame} style={{ maxWidth: boardWidth }}>
				{/* Las 4 esquinas de plástico oscuro */}
				<div className={`${styles.corner} ${styles.topLeft}`}></div>
				<div className={`${styles.corner} ${styles.topRight}`}></div>
				<div className={`${styles.corner} ${styles.bottomLeft}`}></div>
				<div className={`${styles.corner} ${styles.bottomRight}`}></div>

				{/* Superficie blanca */}
				<div className={styles.whiteboard}>{children}</div>

				{/* Bandeja inferior de rotuladores */}
				<div className={styles.markerTray}></div>
			</div>
		</div>
	);
}

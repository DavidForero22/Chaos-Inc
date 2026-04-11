// src/layouts/NotebookLayout.tsx

import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import styles from "./NotebookLayout.module.css";

export default function NotebookLayout() {
	return (
		<div className={styles.pageWrapper}>
			<div className={styles.notebookContainer}>
				{/* ── Pestañas + auth (gestionado en Navbar) ── */}
				<Navbar />

				{/* ── Lomo ── */}
				<div className={styles.notebookSpine} />

				{/* ── Hoja de papel ── */}
				<div className={styles.notebookPaper}>
					<Outlet />
				</div>
			</div>

			{/* ── Footer en la pared ── */}
			<footer className={styles.wallFooter}>
				Chaos Inc. © 2026 &mdash; Documento clasificado &mdash;{" "}
				<a href="#">Política de Destrucción de Datos</a>
			</footer>
		</div>
	);
}

// src/layouts/NotebookLayout.tsx
// Accesibilidad comprobada: SI

import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar/Navbar";
import styles from "./NotebookLayout.module.css";
import Footer from "../components/Footer";

export default function NotebookLayout() {

	return (
		<div className={styles.pageWrapper}>
			<main className={styles.notebookContainer}>
				{/* ── Pestañas + auth (gestionado en Navbar) ── */}
				<Navbar />

				{/* ── Lomo (decorativo) ── */}
				<div
					className={styles.notebookSpine}
					aria-hidden="true"
					role="presentation"
				/>

				{/* ── Hoja de papel ── */}
				<div className={styles.notebookPaper}>
					{/* Contenido principal */}
					<Outlet />
				</div>
			</main>

			<Footer/>
		</div>
	);
}

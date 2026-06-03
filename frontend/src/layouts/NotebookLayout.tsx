// src/layouts/NotebookLayout.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar/Navbar";
import styles from "./NotebookLayout.module.css";
import Footer from "../components/Footer";
import { FaArrowUp } from "react-icons/fa";

export default function NotebookLayout() {
	const [showScrollTop, setShowScrollTop] = useState(false);

	// Efecto para detectar el scroll del usuario
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 300) {
				setShowScrollTop(true);
			} else {
				setShowScrollTop(false);
			}
		};

		window.addEventListener("scroll", handleScroll);

		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Función para volver arriba con animación suave
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

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

			<Footer />

			{/* ── Botón Flotante Volver Arriba ── */}
			<button
				onClick={scrollToTop}
				className={`${styles.scrollToTopBtn} ${
					showScrollTop ? styles.visible : styles.hidden
				}`}
				aria-label="Volver al inicio de la página"
				title="Volver arriba"
			>
				<FaArrowUp />
			</button>
		</div>
	);
}

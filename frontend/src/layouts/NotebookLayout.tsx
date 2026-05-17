// src/layouts/NotebookLayout.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar/Navbar";
import SettingsDropdown from "../components/ui/SettingsDropdown";
import { FaGear } from "react-icons/fa6";
import styles from "./NotebookLayout.module.css";

export default function NotebookLayout() {
	const [showSettings, setShowSettings] = useState(false);
	const [theme, setTheme] = useState("light");
	const [lang, setLang] = useState("es");

	const handleSettingsKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape" && showSettings) {
			setShowSettings(false);
		}
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
					{/* --- BOTÓN DE AJUSTES --- */}
					<div
						className={styles.settingsContainer}
						onKeyDown={handleSettingsKeyDown}
					>
						<button
							className={`${styles.settingsBtn} ${showSettings ? styles.settingsBtnActive : ""}`}
							onClick={() => setShowSettings(!showSettings)}
							title="Configuración"
							aria-label="Abrir configuración"
							aria-expanded={showSettings}
							aria-haspopup="menu"
							aria-controls="settings-dropdown"
						>
							<FaGear aria-hidden="true" />
						</button>

						{showSettings && (
							<div
								id="settings-dropdown"
								role="menu"
								aria-label="Menú de configuración"
							>
								<SettingsDropdown
									theme={theme}
									setTheme={setTheme}
									lang={lang}
									setLang={setLang}
								/>
							</div>
						)}
					</div>

					{/* Contenido principal */}
					<Outlet />
				</div>
			</main>
		</div>
	);
}

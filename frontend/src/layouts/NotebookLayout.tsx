// src/layouts/NotebookLayout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar";
import SettingsDropdown from "../components/ui/SettingsDropdown";
import { FaGear } from "react-icons/fa6";
import styles from "./NotebookLayout.module.css";

export default function NotebookLayout() {
	const [showSettings, setShowSettings] = useState(false);
	const [theme, setTheme] = useState("light");
	const [lang, setLang] = useState("es");

	return (
		<div className={styles.pageWrapper}>
			<div className={styles.notebookContainer}>
				{/* ── Pestañas + auth (gestionado en Navbar) ── */}
				<Navbar />

				{/* ── Lomo ── */}
				<div className={styles.notebookSpine} />

				{/* ── Hoja de papel ── */}
				<div className={styles.notebookPaper}>
					{/* --- BOTÓN DE AJUSTES --- */}
					<div className={styles.settingsContainer}>
						<button
							className={`${styles.settingsBtn} ${showSettings ? styles.settingsBtnActive : ""}`}
							onClick={() => setShowSettings(!showSettings)}
							title="Configuración"
						>
							<FaGear />
						</button>

						{showSettings && (
							<SettingsDropdown
								theme={theme}
								setTheme={setTheme}
								lang={lang}
								setLang={setLang}
							/>
						)}
					</div>

					<Outlet />
				</div>
			</div>
		</div>
	);
}
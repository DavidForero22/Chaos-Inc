// src/components/ui/SettingsDropdown.tsx

import styles from "./SettingsDropdown.module.css";

interface SettingsDropdownProps {
	theme: string;
	setTheme: (theme: string) => void;
	lang: string;
	setLang: (lang: string) => void;
}

export default function SettingsDropdown({
	theme,
	setTheme,
	lang,
	setLang,
}: SettingsDropdownProps) {
	return (
		<div className={styles.settingsDropdown}>
			{/* Sección de Tema */}
			<div className={styles.dropdownSection}>
				<span className={styles.dropdownLabel}>Tema</span>
				<div className="flex gap-4">
					<label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
						<input
							type="radio"
							name="theme"
							checked={theme === "light"}
							onChange={() => setTheme("light")}
							className="accent-[#295c60]"
						/>{" "}
						Claro
					</label>
					<label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
						<input
							type="radio"
							name="theme"
							checked={theme === "dark"}
							onChange={() => setTheme("dark")}
							className="accent-[#295c60]"
						/>{" "}
						Oscuro
					</label>
				</div>
			</div>

			{/* Sección de Idioma */}
			<div className={styles.dropdownSection} style={{ borderBottom: "none" }}>
				<span className={styles.dropdownLabel}>Idioma</span>
				<div className="flex gap-4">
					<label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
						<input
							type="radio"
							name="lang"
							checked={lang === "es"}
							onChange={() => setLang("es")}
							className="accent-[#295c60]"
						/>{" "}
						ES
					</label>
					<label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
						<input
							type="radio"
							name="lang"
							checked={lang === "en"}
							onChange={() => setLang("en")}
							className="accent-[#295c60]"
						/>{" "}
						EN
					</label>
				</div>
			</div>
		</div>
	);
}

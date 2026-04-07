// frontend/src/pages/MainMenuPage.tsx

import styles from "./MainMenuPage.module.css"; // Importamos el CSS Module

export default function MainMenuPage() {

	return (
		<div className={styles.pageContainer}>
			{/* CUERPO PRINCIPAL (Hero Section) */}
			<main className="max-w-7xl mx-auto py-10 px-6">
				{/* Imagen de portada (Placeholder que ocupa todo el ancho del main) */}
				<div
					className={`w-full aspect-21/9 flex items-center justify-center rounded-lg ${styles.heroPlaceholder}`}
				>
					<span className="text-sm text-gray-500 font-medium italic">
						[ Espacio para Imagen Portada ]
					</span>
				</div>

				{/* Título de entrada */}
				<div className="mt-8 text-center">
					<h1
						className="text-4xl font-black mb-2"
						style={{ color: "var(--off-secondary)" }}
					>
						Bienvenido a{" "}
						<span style={{ color: "var(--off-primary)" }}>Chaos Inc.</span>
					</h1>
					<p className="text-xl text-gray-600 font-light">
						Donde el caos es nuestro negocio.
					</p>
				</div>
			</main>

			{/* Footer básico (aséptico, al final de la página) */}
			<footer
				className="text-center py-6 mt-10 border-t"
				style={{
					borderColor: "var(--off-border)",
					fontSize: "11px",
					color: "var(--off-text)",
				}}
			>
				Chaos Inc. © 2026. Todos los derechos
				reservados.
				<br />
				<span style={{ color: "var(--off-muted)" }}>
					Una empresa gestionada para asegurar el{" "}
					<strong style={{ color: "var(--off-primary)" }}>
						crecimiento controlado
					</strong>{" "}
					del caos.
				</span>
			</footer>
		</div>
	);
}

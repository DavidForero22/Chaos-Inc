// src/components/game/RoleRevealModal.tsx
// Accesibilidad comprobada: SI

import { useState, useRef, useEffect } from "react";
import type { UIEvent } from "react";
import type { MyData } from "../../../types/live-game.ts";
import styles from "./RoleRevealModal.module.css";
import { ROLE_CONFIG } from "../../../data/game/roles.ts";

interface RoleRevealModalProps {
	role: MyData["role"];
	onClose: () => void;
	isActingBoss?: boolean;
}

export function RoleRevealModal({ role, onClose }: RoleRevealModalProps) {
	if (role === "hidden") return null;
	const config = ROLE_CONFIG[role];

	// Refs y Estados para el scroll
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showArrow, setShowArrow] = useState(true);

	// --- ACCESIBILIDAD: Refs para gestión de foco ---
	const closeBtnRef = useRef<HTMLButtonElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	// Vigila si el usuario llega al fondo de la pagina
	const handleScroll = (e: UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 80;
		setShowArrow(!isBottom);
	};

	// --- ACCESIBILIDAD: Gestión de apertura y cierre ---
	useEffect(() => {
		// Guardar el elemento que tenía el foco
		previousFocusRef.current = document.activeElement as HTMLElement;

		// 2Mandar el foco al botón de cerrar.
		const timer = setTimeout(() => {
			closeBtnRef.current?.focus({ preventScroll: true });
		}, 50);

		return () => {
			clearTimeout(timer);
			// Devolver el foco a la mesa/botón original al cerrar
			previousFocusRef.current?.focus();
		};
	}, []);

	// --- ACCESIBILIDAD: Cerrar con Escape ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	// Comprobar al montarse si hace falta hacer scroll
	useEffect(() => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight } = scrollRef.current;
			// Si el contenido ya cabe en la pantalla, no mostrar la flecha
			if (scrollHeight <= clientHeight + 5) {
				setShowArrow(false);
			}
		}
	}, []);

	return (
		<div
			className={styles.modalOverlay}
			// --- ACCESIBILIDAD: Semántica de Modal ---
			role="dialog"
			aria-modal="true"
			aria-labelledby="role-title"
		>
			<div className={styles.folderWrapper}>
				{/* ── TAPA DE LA CARPETA (Arriba en móvil, Izquierda en PC) ── */}
				<div className={styles.folderTab} aria-hidden="true">
					{/* El saliente de la carpeta */}
					<div className={styles.folderTabProtrusion} />

					{/* Texto vertical (Solo se ve en PC/Landscape) */}
					{/* Oculto al lector de pantalla porque es puramente decorativo */}
					<div className="hidden md:flex h-full flex-col justify-end items-center pb-32 relative z-10">
						<span className="text-black/30 font-black text-4xl tracking-widest uppercase -rotate-90 whitespace-nowrap">
							Expediente
						</span>
					</div>
				</div>

				{/* ── CONTENEDOR DE LA HOJA */}
				<div className={styles.paperContainer}>
					{/* HOJA DE PAPEL */}
					<div
						className={styles.paperSheet}
						ref={scrollRef}
						onScroll={handleScroll}
						tabIndex={0}
						aria-label="Contenido del expediente"
					>
						<div className={styles.redMargin} aria-hidden="true" />
						{/* Contenido scrolleable */}
						<div className="relative z-10 px-8 md:pl-20 md:pr-10 py-8 flex flex-col h-full">
							<div className="shrink-0 mb-4 text-center">
								<h2
									id="role-title"
									className={`text-sm md:text-base uppercase font-bold tracking-widest mb-1 inline-block border-b-2 border-dashed border-[#393e42]/30 text-[#393e42]`}
								>
									{config.titleLabel}
								</h2>
							</div>

							{/* La Foto Adjunta */}
							<div className="shrink-0 w-full mb-6 flex justify-center">
								<div className="bg-[#f8f9f8] p-2 md:p-4 pb-6 md:pb-12 shadow-lg border border-gray-300 rotate-1 w-full md:max-w-lg lg:max-w-xl relative">
									<div
										className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-5 md:w-16 md:h-6 bg-white/40 backdrop-blur-sm rotate-3 shadow-sm border border-white/20"
										aria-hidden="true"
									/>

									<div className="aspect-video w-full bg-gray-300 overflow-hidden relative border border-gray-400">
										<img
											src={config.image}
											alt={`Fotografía clasificada del rol: ${config.titleLabel}`}
											className="w-full h-full object-cover"
											onError={(e) => {
												e.currentTarget.style.display = "none";
											}}
										/>
										<div
											className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-bold text-gray-500 opacity-50 -z-10 uppercase tracking-widest"
											aria-hidden="true"
										>
											[FOTO_ADJUNTA.JPG]
										</div>
									</div>
								</div>
							</div>

							{/* Texto del objetivo */}
							<div className="grow">
								<h3 className="sr-only">Objetivo Principal</h3>
								<p
									className="text-xs uppercase font-bold mb-1 opacity-70"
									aria-hidden="true"
								>
									Directiva Operativa:
								</p>
								<p className="text-[#393e42] font-bold text-sm md:text-base lg:text-lg leading-relaxed md:leading-8">
									{config.objective}
								</p>
							</div>

							{/* Botón de acción */}
							<div className="mt-6 flex justify-center shrink-0">
								<button
									ref={closeBtnRef}
									onClick={onClose}
									// --- ACCESIBILIDAD: Ring de foco visible para teclado ---
									className="w-full md:max-w-75 px-8 py-3 mb-8 border-[3px] border-[#295c60] text-[#295c60] font-black uppercase tracking-widest hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors bg-transparent focus:outline-none focus:ring-4 focus:ring-[#295c60] focus:ring-offset-2 focus:ring-offset-[#fdfbf2]"
								>
									Entendido
								</button>
							</div>
						</div>
					</div>

					{/* FLECHA DE GARABATO */}
					{/* Oculto a lectores de pantalla (no aporta contexto textual) */}
					<div
						className={`${styles.doodleArrow} ${showArrow ? styles.visible : styles.hidden}`}
						aria-hidden="true"
					>
						<svg
							viewBox="0 0 40 100"
							fill="none"
							stroke="#1e3a8a"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="w-8 h-20 opacity-60"
						>
							<path d="M20 10 Q 22 40, 18 80 M 8 65 Q 18 80, 20 85 Q 22 80, 32 65" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	);
}

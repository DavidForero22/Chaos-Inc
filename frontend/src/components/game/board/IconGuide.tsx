// src/components/game/board/IconGuide.tsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { FaQuestion } from "react-icons/fa";
import { GUIDE_ITEMS } from "../../../data/iconGuideData";
import styles from "./IconGuide.module.css";

export function IconGuide() {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);

	// Estados locales para controlar la animación y el HTML
	const [isRendered, setIsRendered] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	// El useEffect reacciona a los cambios del estado global de Zustand
	useEffect(() => {
		if (activeModal === "guide") {
			setIsRendered(true);
			setIsExiting(false);
		} else if (isRendered) {
			setIsExiting(true);
			const timer = setTimeout(() => {
				setIsRendered(false);
				setIsExiting(false);
			}, 250);

			return () => clearTimeout(timer);
		}
	}, [activeModal]);

	const toggleGuide = () => {
		setActiveModal(activeModal === "guide" ? "none" : "guide");
	};

	const handleClose = () => {
		setActiveModal("none");
	};

	// Si no está renderizado, solo devolver el botón flotante
	if (!isRendered) {
		return (
			<button
				onClick={toggleGuide}
				className={styles.guideButton}
				title="Guía de Iconos"
			>
				<FaQuestion className="w-5 h-5" />
			</button>
		);
	}

	// Contenido del Post-it (Chuleta rápida)
	const guideContent = (
		<div className="flex flex-col flex-1 min-h-0 w-full relative pt-4">
			{/* El trozo de celo en la parte superior */}
			<div className={styles.tape}></div>

			{/* Botón de cerrar camuflado en la esquina */}
			<button
				onClick={handleClose}
				className="absolute top-2 right-2 text-gray-500 hover:text-black font-black text-xl p-2 transition-colors leading-none z-10"
				title="Quitar nota"
			>
				✕
			</button>

			{/* Cabecera estilo manuscrito */}
			<div className="px-5 pt-4 pb-2 shrink-0">
				<h2
					className={`${styles.handwrittenTitle} text-xl text-gray-800 tracking-tight transform -rotate-1 text-center`}
				>
					Guía de Iconos
				</h2>
			</div>

			{/* Cuadrícula de iconos con scroll personalizado */}
			<div
				className={`p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 ${styles.customScroll}`}
			>
				{GUIDE_ITEMS.map((item, idx) => (
					<div key={idx} className="flex gap-3 items-start p-1 min-w-0">
						{/* El icono como si fuera una pegatina o un sello */}
						<div
							className={`w-7 h-7 rounded-full bg-white/50 shadow-sm flex items-center justify-center shrink-0 border border-black/10 text-gray-800 transform rotate-${idx % 2 === 0 ? "3" : "[-3]"}`}
						>
							<item.icon className="w-4 h-4 drop-shadow-sm" />
						</div>
						<div className="mt-0.5 min-w-0 flex-1">
							{/* Título como si estuviera escrito a boli azul oscuro */}
							<p className="text-sm font-bold text-blue-900 leading-none mb-1 truncate">
								{item.name}
							</p>
							{/* Descripción a lápiz/boli negro */}
							<p className="text-xs text-gray-700 leading-tight warp-break-word">
								{item.desc}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<>
			<button
				onClick={toggleGuide}
				className={styles.guideButton}
				title="Guía de Iconos"
			>
				<FaQuestion className="w-5 h-5" />
			</button>

			{createPortal(
				<>
					{/* VERSIÓN MÓVIL (< lg) - Centrado con Overlay */}
					<div
						className={`lg:hidden fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 ${
							isExiting ? "opacity-0 transition-opacity" : ""
						}`}
						onClick={handleClose}
					>
						<div
							className={`${styles.postIt} w-[90vw] max-w-sm max-h-[85vh]`}
							onClick={(e) => e.stopPropagation()}
						>
							{guideContent}
						</div>
					</div>

					{/* VERSIÓN ESCRITORIO (>= lg) - Desliza desde izquierda sin Overlay */}
					<div
						className={`hidden lg:block ${styles.desktopWrapper} ${
							isExiting ? styles.slideOutLeft : styles.slideInLeft
						}`}
					>
						<div
							className={`${styles.postIt} w-90 max-w-[calc(100vw-120px)] max-h-[75vh]`}
						>
							{guideContent}
						</div>
					</div>
				</>,
				document.body,
			)}
		</>
	);
}

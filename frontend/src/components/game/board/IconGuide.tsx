// src/components/game/board/IconGuide.tsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../store/useGameUIStore";
import { FaQuestion } from "react-icons/fa";
import { GUIDE_ITEMS } from "../../../data/iconGuide";
import styles from "./IconGuide.module.css";
import { useFocusTrap } from "../../../hooks/game/useFocusTrap";

export function IconGuide() {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);

	// Estados locales para controlar la animación y el HTML
	const [isRendered, setIsRendered] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	// Referencia para devolver el foco al botón flotante cuando se cierre el modal
	const triggerButtonRef = useRef<HTMLButtonElement>(null);
	const closedByUserRef = useRef(false);

	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const mobileContainerRef = useRef<HTMLDivElement>(null);
	const desktopContainerRef = useRef<HTMLDivElement>(null);

	useFocusTrap(
		[mobileContainerRef, desktopContainerRef],
		activeModal === "guide",
	);

	useEffect(() => {
		if (activeModal === "guide") {
			setIsRendered(true);
			setIsExiting(false);
			setTimeout(() => closeButtonRef.current?.focus(), 50);
		} else if (isRendered) {
			setIsExiting(true);
			const shouldRestoreFocus = closedByUserRef.current;
			closedByUserRef.current = false;

			const timer = setTimeout(() => {
				setIsRendered(false);
				setIsExiting(false);
				// Solo restaurar foco si lo cerró el usuario, no si abrió otro modal
				if (shouldRestoreFocus) {
					triggerButtonRef.current?.focus();
				}
			}, 250);

			return () => clearTimeout(timer);
		}
	}, [activeModal, isRendered]);

	// ACCESIBILIDAD: Cerrar con la tecla Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && activeModal === "guide") {
				closedByUserRef.current = true;
				setActiveModal("none");
			}
		};

		if (activeModal === "guide") {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [activeModal, setActiveModal]);

	const toggleGuide = () => {
		if (activeModal === "guide") {
			closedByUserRef.current = true;
		}
		setActiveModal(activeModal === "guide" ? "none" : "guide");
	};

	const handleClose = () => {
		closedByUserRef.current = true;
		setActiveModal("none");
	};

	// Si no está renderizado, solo devolver el botón flotante
	if (!isRendered) {
		return (
			<button
				ref={triggerButtonRef}
				onClick={toggleGuide}
				className={styles.guideButton}
				title="Guía de Iconos"
				// --- ARIA: Atributos del disparador ---
				aria-label="Abrir guía de iconos"
				aria-haspopup="dialog"
				aria-expanded="false"
			>
				<FaQuestion className="w-5 h-5" aria-hidden="true" />
			</button>
		);
	}

	// Contenido del Post-it (Chuleta rápida)
	const guideContent = (
		<div
			className="flex flex-col flex-1 min-h-0 w-full relative pt-4"
			// --- ARIA: Semántica de Modal ---
			role="dialog"
			aria-modal="true"
			aria-label="Guía de Iconos"
		>
			<div className={styles.tape} aria-hidden="true"></div>

			<button
				ref={closeButtonRef}
				onClick={handleClose}
				disabled={isExiting}
				className="absolute top-2 right-2 text-gray-500 hover:text-black font-black text-xl p-2 transition-colors leading-none z-10 disabled:opacity-50"
				title="Quitar nota"
				aria-label="Cerrar guía de iconos"
			>
				✕
			</button>

			<div className="px-5 pt-4 pb-2 shrink-0">
				<h2
					className={`${styles.handwrittenTitle} text-xl text-gray-800 tracking-tight transform -rotate-1 text-center`}
				>
					Guía de Iconos
				</h2>
			</div>

			{/* ACCESIBILIDAD: Cambiado de <div> a <ul> para estructura semántica */}
			<ul
				className={`p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-4 ${styles.customScroll}`}
			>
				{GUIDE_ITEMS.map((item, idx) => (
					<li key={idx} className="flex gap-3 items-start p-1 min-w-0">
						<div
							className={`w-7 h-7 rounded-full bg-white/50 shadow-sm flex items-center justify-center shrink-0 border border-black/10 text-gray-800 transform rotate-${idx % 2 === 0 ? "3" : "[-3]"}`}
							aria-hidden="true"
						>
							<item.icon className="w-4 h-4 drop-shadow-sm" />
						</div>
						<div className="mt-0.5 min-w-0 flex-1">
							<p className="text-sm font-bold text-blue-900 leading-none mb-1 truncate">
								{item.name}
							</p>
							<p className="text-xs text-gray-700 leading-tight warp-break-word">
								{item.desc}
							</p>
						</div>
					</li>
				))}
			</ul>
		</div>
	);

	return (
		<>
			<button
				ref={triggerButtonRef}
				onClick={toggleGuide}
				className={styles.guideButton}
				title="Guía de Iconos"
				aria-label="Cerrar guía de iconos"
				aria-haspopup="dialog"
				aria-expanded="true"
			>
				<FaQuestion className="w-5 h-5" aria-hidden="true" />
			</button>

			{createPortal(
				<>
					{/* VERSIÓN MÓVIL (< lg) */}
					<div
						ref={mobileContainerRef}
						className={`lg:hidden fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 ${
							isExiting ? "opacity-0 transition-opacity" : ""
						}`}
						onClick={handleClose}
					>
						<div
							className={`${styles.postIt} w-[90vw] h-[45vh] max-w-[70vw] max-h-[85vh]`}
							onClick={(e) => e.stopPropagation()}
						>
							{guideContent}
						</div>
					</div>

					{/* VERSIÓN ESCRITORIO (>= lg) */}
					<div
						ref={desktopContainerRef}
						className={`hidden lg:block ${styles.desktopWrapper} ${
							isExiting ? styles.slideOutLeft : styles.slideInLeft
						}`}
					>
						<div className={`${styles.postIt} w-150 h-[45vh] max-h-[75vh]`}>
							{guideContent}
						</div>
					</div>
				</>,
				document.body,
			)}
		</>
	);
}

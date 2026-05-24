// src/components/game/board/GameLog.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect, useRef } from "react";
import { useGameUIStore } from "../../../store/game/useGameUIStore";
import { createPortal } from "react-dom";
import styles from "./GameLog.module.css";
import { useNotificationStore } from "../../../store/ui/useNotificationStore";
import { useFocusTrap } from "../../../hooks/ui/useFocusTrap";

export function GameLog() {
	const logs = useNotificationStore((state) => state.logs);

	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);
	const isOpen = activeModal === "log";

	// Estados para la animación diferida (Solo versión móvil)
	const [isMobileRendered, setIsMobileRendered] = useState(false);
	const [isMobileExiting, setIsMobileExiting] = useState(false);
	const [hasNew, setHasNew] = useState(false);

	const prevLengthRef = useRef(logs.length);
	const mobileScrollRef = useRef<HTMLDivElement>(null);
	const desktopScrollRef = useRef<HTMLDivElement>(null);

	// --- ACCESIBILIDAD: Referencia para guardar el elemento que abrió el modal ---
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const closeButtonMobileRef = useRef<HTMLButtonElement>(null);
	const closeButtonDesktopRef = useRef<HTMLButtonElement>(null);
	const mobileContainerRef = useRef<HTMLDivElement>(null);
	useFocusTrap([mobileContainerRef], isMobileRendered && !isMobileExiting);

	const scrollToBottom = () => {
		if (mobileScrollRef.current) {
			mobileScrollRef.current.scrollTop = mobileScrollRef.current.scrollHeight;
		}
		if (desktopScrollRef.current) {
			desktopScrollRef.current.scrollTop =
				desktopScrollRef.current.scrollHeight;
		}
	};

	// Efecto para la notificación
	useEffect(() => {
		if (isOpen) {
			prevLengthRef.current = logs.length;
			setHasNew(false);
		} else if (logs.length > prevLengthRef.current) {
			setHasNew(true);
		}
	}, [logs.length, isOpen]);

	// Efecto para hacer scroll hacia abajo al abrir el modal
	useEffect(() => {
		if (isOpen || isMobileRendered) {
			setTimeout(scrollToBottom, 100);
		}
		// Foco en escritorio al abrir
		if (isOpen) {
			setTimeout(() => closeButtonDesktopRef.current?.focus(), 50);
		}
	}, [isOpen, isMobileRendered]);

	useEffect(() => {
		if (!isOpen && previousFocusRef.current) {
			previousFocusRef.current.focus();
			previousFocusRef.current = null;
		}
	}, [isOpen]);

	// --- ACCESIBILIDAD: Cerrar con la tecla Escape ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				setActiveModal("none");
			}
		};

		if (isOpen) {
			window.addEventListener("keydown", handleKeyDown);
		}
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, setActiveModal]);

	// Efecto para la animación diferida de salida en móvil
	useEffect(() => {
		if (activeModal === "log") {
			setIsMobileRendered(true);
			setIsMobileExiting(false);
			setTimeout(() => closeButtonMobileRef.current?.focus(), 50);
		} else if (isMobileRendered) {
			setIsMobileExiting(true);
			const timer = setTimeout(() => {
				setIsMobileRendered(false);
				setIsMobileExiting(false);
			}, 250);
			return () => clearTimeout(timer);
		}
	}, [activeModal, isMobileRendered]);

	const toggleLog = () => {
		if (!isOpen) {
			previousFocusRef.current = document.activeElement as HTMLElement;
		}
		setActiveModal(isOpen ? "none" : "log");
	};

	const handleClose = () => {
		setActiveModal("none");
	};

	const renderLogMessages = (
		scrollRef: React.RefObject<HTMLDivElement | null>,
	) => (
		<div
			ref={scrollRef}
			className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 no-scrollbar bg-[#0f1115]"
			role="log"
			aria-live="polite"
			aria-atomic="false"
		>
			{logs.length === 0 ? (
				<p className="text-gray-600 text-xs text-center py-4 italic mt-auto mb-auto">
					No hay mensajes nuevos.
				</p>
			) : (
				logs.map((entry) => (
					<div key={entry.id} className="w-full">
						<div className="flex flex-col bg-gray-800/50 px-3 py-2 rounded-lg rounded-tl-none border border-gray-700/50">
							<p className="text-gray-300 text-xs leading-relaxed font-sans">
								{entry.message}
							</p>
							<span
								className="text-blue-500/50 text-[10px] font-mono self-end mt-1"
								aria-hidden="true"
							>
								{entry.timestamp}
							</span>
						</div>
					</div>
				))
			)}
		</div>
	);

	return (
		<>
			{/* BOTÓN MÓVIL */}
			<button
				onClick={toggleLog}
				className={`lg:hidden ${styles.mobileLogButton}`}
				title="Mostrar eventos"
				aria-label={
					hasNew
						? "Mostrar eventos de partida (Hay mensajes nuevos)"
						: "Mostrar eventos de partida"
				}
				aria-haspopup="dialog"
				aria-expanded={isOpen}
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
				{hasNew && !isOpen && (
					<span className="absolute top-7 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse border border-[#1a1a1a]"></span>
				)}
			</button>

			{/* ==========================================
                VERSIÓN MÓVIL (< lg) -> LA TABLET
            ========================================== */}
			{isMobileRendered &&
				createPortal(
					<div
						ref={mobileContainerRef}
						className={`lg:hidden fixed inset-0 z-200 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 ${
							isMobileExiting
								? "opacity-0 transition-opacity duration-250 ease-in"
								: "animate-in fade-in duration-250 ease-out"
						}`}
						onClick={handleClose}
					>
						<div
							className={styles.tabletChassis}
							onClick={(e) => e.stopPropagation()}
							role="dialog"
							aria-modal="true"
							aria-label="Registro de eventos de la partida"
						>
							<div
								className="absolute top-5 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-black rounded-full z-10"
								aria-hidden="true"
							></div>

							<div className="w-full h-full bg-black rounded-2xl overflow-hidden relative flex flex-col border-2 border-black">
								<div
									className="bg-gray-800 text-center py-3 px-4 border-b border-gray-700 shrink-0"
									aria-hidden="true"
								>
									<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
										Slack Empresarial
									</p>
									<p className="text-xs text-white font-bold">
										# general-partida
									</p>
								</div>
								{renderLogMessages(mobileScrollRef)}
							</div>

							<button
								ref={closeButtonMobileRef}
								className={styles.homeButton}
								onClick={handleClose}
								title="Cerrar eventos de la partida"
								aria-label="Cerrar registro de eventos"
								disabled={isMobileExiting}
							></button>
						</div>
					</div>,
					document.body,
				)}

			{/* ==========================================
                VERSIÓN ESCRITORIO (>= lg) -> EL TELÉFONO
            ========================================== */}
			<div
				className={`hidden lg:block ${styles.phoneWrapper} ${isOpen ? styles.phoneWrapperOpen : ""}`}
				aria-hidden={!isOpen}
			>
				<div
					className={styles.phoneChassis}
					role="complementary"
					aria-label="Registro de eventos de la partida"
				>
					<div
						className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-black rounded-full z-10"
						aria-hidden="true"
					></div>

					<div className="w-full h-full bg-black rounded-2xl overflow-hidden relative flex flex-col border-2 border-black">
						<div
							className="bg-gray-800 text-center py-3 border-b border-gray-700 shrink-0"
							aria-hidden="true"
						>
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
								Slack Empresarial
							</p>
							<p className="text-xs text-white font-bold"># general-partida</p>
						</div>
						{renderLogMessages(desktopScrollRef)}
					</div>

					<button
						ref={closeButtonDesktopRef}
						className={styles.homeButton}
						onClick={handleClose}
						title="Cerrar eventos de la partida"
						aria-label="Cerrar registro de eventos"
						tabIndex={isOpen ? 0 : -1}
						disabled={!isOpen}
					></button>
				</div>
			</div>
		</>
	);
}

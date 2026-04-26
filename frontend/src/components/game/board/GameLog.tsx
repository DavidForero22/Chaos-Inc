// src/components/game/board/GameLog.tsx

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../../store/useGameStore";
import styles from "./GameLog.module.css";

export function GameLog() {
	const logs = useGameStore((state) => state.logs);

	const [isOpen, setIsOpen] = useState(false);
	const [hasNew, setHasNew] = useState(false);

	const prevLengthRef = useRef(logs.length);
	const mobileScrollRef = useRef<HTMLDivElement>(null);
	const desktopScrollRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		if (mobileScrollRef.current) {
			mobileScrollRef.current.scrollTop = mobileScrollRef.current.scrollHeight;
		}
		if (desktopScrollRef.current) {
			desktopScrollRef.current.scrollTop =
				desktopScrollRef.current.scrollHeight;
		}
	};

	useEffect(() => {
		if (isOpen) {
			prevLengthRef.current = logs.length;
			setHasNew(false);
			scrollToBottom();
		} else if (logs.length > prevLengthRef.current) {
			setHasNew(true);
		}
	}, [logs.length, isOpen]);

	const toggleLog = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setTimeout(scrollToBottom, 50);
		}
	};

	return (
		<>
			{/* ==========================================
                VERSIÓN MÓVIL (< lg)
            ========================================== */}

			{/* BOTÓN MÓVIL (Izquierda) */}
			<button
				onClick={toggleLog}
				className={`lg:hidden ${styles.mobileLogButton}`}
				title="Mostrar eventos"
			>
				<svg
					className="w-5 h-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
					/>
				</svg>
				{hasNew && !isOpen && (
					<span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse border border-[#1a1a1a]"></span>
				)}
			</button>

			{/* MODAL MÓVIL */}
			{isOpen && (
				<div className="lg:hidden fixed inset-0 z-200 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
					<div className="w-full max-w-2xl h-full max-h-[90vh] bg-[#0f1115] border border-gray-600 rounded-xl flex flex-col shadow-2xl relative overflow-hidden">
						<div className="bg-gray-800 text-center py-3 px-4 border-b border-gray-700 shrink-0 flex justify-between items-center">
							<div className="text-left">
								<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
									Slack Empresarial
								</p>
								<p className="text-xs text-white font-bold">
									# general-partida
								</p>
							</div>
							<button
								onClick={toggleLog}
								className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={3}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>
						<div
							ref={mobileScrollRef}
							className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 no-scrollbar bg-[#0f1115]"
						>
							{logs.length === 0 ? (
								<p className="text-gray-600 text-xs text-center py-4 italic mt-auto mb-auto">
									No hay mensajes nuevos.
								</p>
							) : (
								logs.map((entry) => (
									<div key={entry.id} className="flex gap-3 items-start">
										<span className="text-blue-500/50 text-[10px] shrink-0 mt-0.5 font-mono w-12 text-right">
											{entry.timestamp}
										</span>
										<p className="text-gray-300 text-xs leading-relaxed font-sans bg-gray-800/50 p-2 rounded-lg rounded-tl-none border border-gray-700/50">
											{entry.message}
										</p>
									</div>
								))
							)}
						</div>
					</div>
				</div>
			)}

			{/* ==========================================
                VERSIÓN ESCRITORIO (>= lg)
            ========================================== */}

			{/* TELÉFONO ESCRITORIO */}
			<div
				className={`hidden lg:block ${styles.phoneWrapper} ${isOpen ? styles.phoneWrapperOpen : ""}`}
			>
				<div className={styles.phoneChassis}>
					{/* Altavoz superior de la pantalla */}
					<div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-black rounded-full z-10"></div>

					{/* Pantalla del Teléfono */}
					<div className="w-full h-full bg-black rounded-2xl overflow-hidden relative flex flex-col border-2 border-black">
						<div className="bg-gray-800 text-center py-3 border-b border-gray-700 shrink-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
								Slack Empresarial
							</p>
							<p className="text-xs text-white font-bold"># general-partida</p>
						</div>
						<div
							ref={desktopScrollRef}
							className="flex-1 overflow-y-auto flex flex-col gap-3 p-3 no-scrollbar bg-[#0f1115]"
						>
							{logs.length === 0 ? (
								<p className="text-gray-600 text-xs text-center py-4 italic">
									No hay mensajes nuevos.
								</p>
							) : (
								logs.map((entry) => (
									<div key={entry.id} className="flex gap-2 items-start">
										<span className="text-blue-500/50 text-[10px] shrink-0 mt-0.5 font-mono">
											{entry.timestamp}
										</span>
										<p className="text-gray-300 text-xs leading-snug font-sans">
											{entry.message}
										</p>
									</div>
								))
							)}
						</div>
					</div>
					<button
						className={styles.homeButton}
						onClick={() => setIsOpen(false)}
						title="Cerrar eventos de la partida"
					></button>
				</div>
			</div>
		</>
	);
}

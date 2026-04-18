// src/components/game/board/GameLog.tsx

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../../store/useGameStore";
import styles from "./GameLog.module.css";

export function GameLog() {
	const logs = useGameStore((state) => state.logs);

	const [isOpen, setIsOpen] = useState(false);
	const [hasNew, setHasNew] = useState(false);

	const prevLengthRef = useRef(logs.length);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen) {
			prevLengthRef.current = logs.length;
			setHasNew(false);
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		} else if (logs.length > prevLengthRef.current) {
			setHasNew(true);
		}
	}, [logs.length, isOpen]);

	const togglePhone = () => {
		setIsOpen(!isOpen);
		if (!isOpen) {
			setTimeout(() => {
				if (scrollRef.current) {
					scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
				}
			}, 10);
		}
	};

	return (
		<>
			{/* --- BOTÓN LATERAL --- */}
			<button onClick={togglePhone} className={styles.tabButton} title={isOpen ? "Cerrar eventos de la partida" : "Mostrar eventos de la partida"}>
				Eventos
				{hasNew && !isOpen && (
					<span className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
				)}
			</button>

			{/* --- TELÉFONO MÓVIL --- */}
			<div
				className={`${styles.phoneWrapper} ${isOpen ? styles.phoneWrapperOpen : ""}`}
			>
				<div className={styles.phoneChassis}>
					{/* Altavoz superior de la pantalla */}
					<div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-black rounded-full z-10"></div>

					{/* Pantalla del Teléfono */}
					<div className="w-full h-full bg-black rounded-2xl overflow-hidden relative flex flex-col border-2 border-black">
						{/* Cabecera estilo App de Chat Corporativo */}
						<div className="bg-gray-800 text-center py-3 border-b border-gray-700 shrink-0">
							<p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
								Slack Empresarial
							</p>
							<p className="text-xs text-white font-bold"># general-partida</p>
						</div>

						{/* Lista de Mensajes */}
						<div
							ref={scrollRef}
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

					{/* Botón Home (esconde el teléfono) */}
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

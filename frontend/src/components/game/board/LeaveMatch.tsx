// src/components/game/board/LeaveMatch.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FaDoorOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "../../../store/room/useRoomStore";
import { logWithTime } from "../../../utils/logger.ts";

export function LeaveMatch() {
	const [isOpen, setIsOpen] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	const leaveRoom = useRoomStore((state) => state.leaveRoom);
	const navigate = useNavigate();

	// Referencias para manejar el foco de accesibilidad
	const triggerBtnRef = useRef<HTMLButtonElement>(null);
	const cancelBtnRef = useRef<HTMLButtonElement>(null);

	const handleOpen = () => {
		setIsOpen(true);
		setIsExiting(false);
		// El foco se moverá automáticamente al botón de cancelar por el autoFocus
	};

	const handleClose = () => {
		if (isExiting) return;
		setIsExiting(true);
		setTimeout(() => {
			setIsOpen(false);
			setIsExiting(false);
			// Devolver el foco al botón que abrió el modal
			triggerBtnRef.current?.focus();
		}, 250);
	};

	const handleConfirm = async () => {
		try {
			await leaveRoom();
			handleClose();
			navigate("/");
		} catch (error) {
			logWithTime(
				"LeaveMatch.tsx::handleConfirm() - Error al abandonar la sala: ",
				error,
				"error",
			);
			handleClose();
			navigate("/");
		}
	};

	// Cerrar el modal con la tecla Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen && !isExiting) {
				handleClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, isExiting]);

	return (
		<>
			{/* BOTÓN HUD (Siempre visible) */}
			<button
				ref={triggerBtnRef}
				onClick={handleOpen}
				aria-label="Abandonar Partida"
				aria-haspopup="dialog"
				aria-expanded={isOpen}
				className="bg-red-700 hover:bg-red-600 text-white rounded-md border-2 border-red-900 shadow-md transition-colors flex items-center justify-center h-10 w-10 relative"
				title="Abandonar Partida"
			>
				<FaDoorOpen className="w-5 h-5" aria-hidden="true" />
			</button>

			{/* MODAL DE ERROR 95 (Portal) */}
			{isOpen &&
				createPortal(
					<div
						className={`fixed inset-0 z-300 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 ${
							isExiting
								? "opacity-0 transition-opacity duration-250 ease-in"
								: "animate-in fade-in duration-250 ease-out"
						}`}
						onClick={handleClose}
					>
						{/* Ventana estilo Windows 95/98 */}
						<div
							role="dialog"
							aria-modal="true"
							aria-labelledby="leave-match-title"
							aria-describedby="leave-match-desc"
							className="bg-[#c0c0c0] w-full max-w-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col font-sans"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Barra de título */}
							<div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
								<h2
									id="leave-match-title"
									className="font-bold text-sm tracking-wide m-0"
								>
									Confirmación
								</h2>
								<button
									onClick={handleClose}
									aria-label="Cerrar ventana de confirmación"
									className="bg-[#c0c0c0] text-black w-5 h-5 flex items-center justify-center font-bold text-xs border-t border-l border-b border-r border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white"
									title="Cerrar"
								>
									<span aria-hidden="true">X</span>
								</button>
							</div>

							{/* Contenido */}
							<div className="p-5 flex gap-4 items-start">
								<div aria-hidden="true" className="text-4xl leading-none">
									⚠️
								</div>
								<div
									id="leave-match-desc"
									className="text-sm text-black leading-snug"
								>
									¿Estás seguro de que deseas abandonar la partida?
									<br />
									<br />
									Podrás reconectarte más tarde, pero{" "}
									<span className="font-bold text-red-700">
										recibirás una penalización
									</span>{" "}
									al reconectarte.
								</div>
							</div>

							{/* Botones de acción */}
							<div className="p-4 pt-0 flex justify-end gap-3">
								<button
									ref={cancelBtnRef}
									autoFocus
									onClick={handleClose}
									className="px-4 py-1 bg-[#c0c0c0] text-black text-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
								>
									Cancelar
								</button>

								<button
									onClick={handleConfirm}
									className="px-4 py-1 bg-[#c0c0c0] text-black font-bold text-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white outline-none focus:ring-2 focus:ring-black focus:ring-offset-1"
								>
									Abandonar
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}

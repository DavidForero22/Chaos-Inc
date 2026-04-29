// src/components/game/board/LeaveMatch.tsx

import { useState } from "react";
import { createPortal } from "react-dom";
import { FaDoorOpen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "../../../store/useRoomStore.ts";
import { logWithTime } from "../../../utils/logger.ts";

export function LeaveMatch() {
	const [isOpen, setIsOpen] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	const leaveRoom = useRoomStore((state) => state.leaveRoom);
	const navigate = useNavigate();

	const handleOpen = () => {
		setIsOpen(true);
		setIsExiting(false);
	};

	const handleClose = () => {
		if (isExiting) return;
		setIsExiting(true);
		setTimeout(() => {
			setIsOpen(false);
			setIsExiting(false);
		}, 250);
	};

	const handleConfirm = async () => {
		try {
			await leaveRoom(); 
			handleClose();
			navigate("/"); 
		} catch (error) {
			logWithTime("Error al abandonar la sala: ", error);
			handleClose();
			navigate("/");
		}
	};

	return (
		<>
			{/* BOTÓN HUD (Siempre visible) */}
			<button
				onClick={handleOpen}
				className="bg-red-700 hover:bg-red-600 text-white rounded-md border-2 border-red-900 shadow-md transition-colors flex items-center justify-center h-10 w-10 relative"
				title="Abandonar Partida"
			>
				<FaDoorOpen className="w-5 h-5" />
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
							className="bg-[#c0c0c0] w-full max-w-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col font-sans"
							onClick={(e) => e.stopPropagation()} 
						>
							{/* Barra de título */}
							<div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center">
								<span className="font-bold text-sm tracking-wide">
									Confirmación
								</span>
								<button
									onClick={handleClose}
									className="bg-[#c0c0c0] text-black w-5 h-5 flex items-center justify-center font-bold text-xs border-t border-l border-b border-r border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white"
									title="Cerrar"
								>
									X
								</button>
							</div>

							{/* Contenido */}
							<div className="p-5 flex gap-4 items-start">
								<div className="text-4xl leading-none">⚠️</div>
								<div className="text-sm text-black leading-snug">
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
									onClick={handleClose}
									className="px-4 py-1 bg-[#c0c0c0] text-black text-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white outline-none focus:ring-1 focus:ring-black focus:ring-offset-1"
								>
									Cancelar
								</button>

								<button
									onClick={handleConfirm}
									className="px-4 py-1 bg-[#c0c0c0] text-black font-bold text-sm border-t-2 border-l-2 border-b-2 border-r-2 border-[#1a1a1a] active:border-t-[#1a1a1a] active:border-l-[#1a1a1a] active:border-b-white active:border-r-white outline-none focus:ring-1 focus:ring-black focus:ring-offset-1"
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

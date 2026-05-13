// src/components/game/board/DebugTools.tsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../../store/useGameUIStore";
import { useGameStore } from "../../../../store/useGameStore";
import { FaBug } from "react-icons/fa";
import { RiSwordLine } from "react-icons/ri";
import styles from "./DebugTools.module.css";
import { useDebug } from "../../../../hooks/game/useDebug";
import { PlayerModifier } from "./PlayerModifier";

interface DebugToolsProps {
	roomId: string;
}

const ROLES = ["boss", "secretary", "intern", "union"];

export function DebugTools({ roomId }: DebugToolsProps) {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);

	// Extraemos tus propios datos del store
	const me = useGameStore((state) => state.gameData?.me);

	const [isRendered, setIsRendered] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	const {
		debugState,
		isSubmitting,
		message,
		cardCatalog,
		isLoadingCatalog,
		updateIsDead,
		updateCardQuantity,
		updateModification,
		updateRoomAction,
		handleSubmit,
	} = useDebug(roomId, me?.id);

	useEffect(() => {
		if (activeModal === "debug") {
			setIsRendered(true);
			setIsExiting(false);
		} else if (isRendered) {
			setIsExiting(true);
			const timer = setTimeout(() => {
				setIsRendered(false);
				setIsExiting(false);
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [activeModal, isRendered]);

	const toggleDebug = () => {
		setActiveModal(activeModal === "debug" ? "none" : "debug");
	};

	const handleClose = () => {
		setActiveModal("none");
	};

	if (!isRendered) {
		return (
			<button
				onClick={toggleDebug}
				className={styles.debugButton}
				title="Herramientas de Debug"
			>
				<FaBug className="w-5 h-5" />
			</button>
		);
	}

	const debugContent = (
		<div className="flex flex-col flex-1 min-h-0 w-full relative pt-4">
			{/* Cinta adhesiva */}
			<div className={styles.tape}></div>

			{/* Botón cerrar */}
			<button
				onClick={handleClose}
				className="absolute top-2 right-2 text-gray-500 hover:text-black font-black text-xl p-2 transition-colors leading-none z-10"
				title="Cerrar debug"
			>
				✕
			</button>

			{/* Cabecera */}
			<div className="px-5 pt-4 pb-2 shrink-0">
				<h2
					className={`${styles.handwrittenTitle} text-xl text-gray-800 tracking-tight transform -rotate-1 text-center`}
				>
					🛠️ Debug Tools
				</h2>
				<p className="text-xs text-gray-600 text-center mt-1">
					Modificando a: <strong>{me?.name || "Desconocido"}</strong>
				</p>
			</div>

			{/* Contenido scrolleable */}
			<div
				className={`p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-${styles.customScroll}`}
			>
				{/* ─── MODIFICACIONES DE JUGADOR ─── */}
				<PlayerModifier
					playerRole={me?.role}
					debugState={debugState}
					isSubmitting={isSubmitting}
					cardCatalog={cardCatalog}
					isLoadingCatalog={isLoadingCatalog}
					onUpdateStress={(level) => updateModification("set_stress", level)}
					onUpdateCardQuantity={updateCardQuantity}
					onUpdateIsDead={updateIsDead}
					onSubmit={() => handleSubmit("modify_player")}
				/>

				<hr className="my-4 border-gray-300" />

				{/* ─── ACCIONES DE SALA ─── */}
				<section className="space-y-3 bg-white/40 p-3 rounded-lg">
					<h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
						<RiSwordLine className="w-4 h-4" /> Acciones de Sala
					</h3>

					{/* Forzar victoria */}
					<div className="space-y-1">
						<label className="text-xs font-semibold text-gray-700">
							Forzar Victoria
						</label>
						<div className="flex gap-2 flex-wrap">
							{[...ROLES, "cancelled"].map(
								(option) =>
									option !== "secretary" && (
										<button
											key={option}
											onClick={() =>
												updateRoomAction(
													"force_win",
													debugState.roomActions.force_win === option
														? undefined
														: option,
												)
											}
											className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
												debugState.roomActions.force_win === option
													? "bg-yellow-500 text-white border-yellow-600"
													: "bg-white text-gray-700 border-gray-300 hover:bg-yellow-100"
											}`}
										>
											{option === "cancelled" ? "Cancelada" : option}
										</button>
									),
							)}
						</div>
					</div>

					<button
						onClick={() => handleSubmit("room_action")}
						disabled={!debugState.roomActions.force_win || isSubmitting}
						className="w-full mt-2 px-3 py-2 mb-7 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
					>
						{isSubmitting ? "Cargando..." : "Confirmar victoria"}
					</button>
				</section>

				{/* Mensaje de feedback */}
				{message && (
					<div
						className={`px-3 py-2 rounded text-xs font-bold text-center mt-4 ${
							message.startsWith("✅")
								? "bg-green-100 text-green-800 border border-green-300"
								: "bg-red-100 text-red-800 border border-red-300"
						}`}
					>
						{message}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<>
			<button
				onClick={toggleDebug}
				className={styles.debugButton}
				title="Herramientas de Debug"
			>
				<FaBug className="w-5 h-5" />
			</button>

			{createPortal(
				<>
					{/* VERSIÓN MÓVIL - Pantalla completa con overlay */}
					<div
						className={`lg:hidden fixed inset-0 z-200 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 ${
							isExiting ? "opacity-0 transition-opacity" : ""
						}`}
						onClick={handleClose}
					>
						<div
							className={`${styles.postIt} w-full h-full max-h-full`}
							onClick={(e) => e.stopPropagation()}
						>
							{debugContent}
						</div>
					</div>

					{/* VERSIÓN ESCRITORIO - Desliza desde la izquierda */}
					<div
						className={`hidden lg:block ${styles.desktopWrapper} ${
							isExiting ? styles.slideOutRight : styles.slideInRight
						}`}
					>
						<div className={`${styles.postIt} w-96 h-[80vh] max-h-[80vh]`}>
							{debugContent}
						</div>
					</div>
				</>,
				document.body,
			)}
		</>
	);
}

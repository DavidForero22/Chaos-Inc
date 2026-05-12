// src/components/game/board/DebugTools.tsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../../store/useGameUIStore";
import { useGameBoard } from "../../../../hooks/game/useGameBoard";
import { FaBug } from "react-icons/fa";
import { RiGhostLine, RiSwordLine } from "react-icons/ri";
import styles from "./DebugTools.module.css";
import { useDebug } from "../../../../hooks/game/useDebug";
import { PlayerRemoveSelector } from "./PlayerRemoveSelector";
import { PlayerModifier } from "./PlayerModifier";

interface DebugToolsProps {
	roomId: string;
}
const ROLES = ["boss", "secretary", "intern", "union"];

export function DebugTools({ roomId }: DebugToolsProps) {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);
	const board = useGameBoard();

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
		updateSpawnGhost,
		handleSubmit,
		isRemoveMode,
		playersToRemove,
		toggleRemoveMode,
		togglePlayerToRemove,
	} = useDebug(roomId, board.me?.id || "");

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
	}, [activeModal]);

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
					Jugador: {board.me?.name || "Desconocido"}
				</p>
			</div>

			{/* Contenido scrolleable */}
			<div
				className={`p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-${styles.customScroll}`}
			>
				{/* ─── MODIFICACIONES DE JUGADOR ─── */}
				<PlayerModifier
					playerRole={board.me?.role || "union"}
					debugState={debugState}
					isSubmitting={isSubmitting}
					cardCatalog={cardCatalog}
					isLoadingCatalog={isLoadingCatalog}
					onUpdateStress={(level) => updateModification("set_stress", level)}
					onUpdateCardQuantity={updateCardQuantity}
					onUpdateRole={(role) => updateModification("set_role", role)}
					onUpdateIsDead={updateIsDead}
					onSubmit={() => handleSubmit("modify_player")}
				/>

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
									option != "secretary" && (
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
						disabled={!debugState.roomActions.force_win}
						className="w-full mt-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
					>
						{isSubmitting ? "Ejecutando..." : "Ejecutar Acción"}
					</button>

					{/* Eliminar fantasma */}
					<PlayerRemoveSelector
						opponents={board.game?.opponents || []}
						isRemoveMode={isRemoveMode}
						playersToRemove={playersToRemove}
						isSubmitting={isSubmitting}
						onToggleRemoveMode={toggleRemoveMode}
						onTogglePlayer={togglePlayerToRemove}
						onConfirmRemove={() => handleSubmit("room_action")}
					/>
				</section>

				{/* ─── CREAR FANTASMA ─── */}
				<section className="space-y-3 bg-white/40 p-3 rounded-lg">
					<h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
						<RiGhostLine className="w-4 h-4" /> Crear Fantasma
					</h3>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-gray-700">
							Nombre
						</label>
						<input
							type="text"
							placeholder="Username..."
							value={debugState.spawnGhost.username}
							onChange={(e) => updateSpawnGhost("username", e.target.value)}
							className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-400"
							maxLength={50}
						/>
					</div>

					<div className="space-y-1">
						<label className="text-xs font-semibold text-gray-700">Rol</label>
						<div className="flex gap-2 flex-wrap">
							{ROLES.map((role) => (
								<button
									key={role}
									onClick={() => updateSpawnGhost("role", role)}
									className={`px-2 py-1 text-xs rounded border capitalize transition-colors ${
										debugState.spawnGhost.role === role
											? "bg-cyan-500 text-white border-cyan-600"
											: "bg-white text-gray-700 border-gray-300 hover:bg-cyan-100"
									}`}
								>
									{role}
								</button>
							))}
						</div>
					</div>

					<button
						onClick={() => handleSubmit("spawn_ghost")}
						disabled={isSubmitting}
						className="w-full mt-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
					>
						{isSubmitting ? "Creando..." : "Crear Fantasma"}
					</button>
				</section>

				{/* Mensaje de feedback */}
				{message && (
					<div
						className={`px-3 py-2 rounded text-xs font-bold text-center ${
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

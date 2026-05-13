// src/components/game/board/DebugTools.tsx

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../../store/useGameUIStore";
import { useGameStore } from "../../../../store/useGameStore";
import { FaBug } from "react-icons/fa";
import styles from "./DebugTools.module.css";
import { useDebug } from "../../../../hooks/game/useDebug";
import { PlayerModifier } from "./PlayerModifier";
import { useFocusTrap } from "../../../../hooks/game/useFocusTrap";

interface DebugToolsProps {
	roomId: string;
}

const ROLES = ["boss", "secretary", "intern", "union"];

export function DebugTools({ roomId }: DebugToolsProps) {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);

	const me = useGameStore((state) => state.gameData?.me);

	const [isRendered, setIsRendered] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	const {
		debugState,
		isSubmitting,
		cardCatalog,
		isLoadingCatalog,
		updateIsDead,
		updateCardQuantity,
		updateModification,
		updateRoomAction,
		handleSubmit,
	} = useDebug(roomId, me?.id);

	const triggerButtonRef = useRef<HTMLButtonElement>(null);
	const closedByUserRef = useRef(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const mobileContainerRef = useRef<HTMLDivElement>(null);
	const desktopContainerRef = useRef<HTMLDivElement>(null);

	useFocusTrap(
		[mobileContainerRef, desktopContainerRef],
		activeModal === "debug",
	);

	useEffect(() => {
		if (activeModal === "debug") {
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
				if (shouldRestoreFocus) {
					triggerButtonRef.current?.focus();
				}
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [activeModal, isRendered]);

	const toggleDebug = () => {
		if (activeModal === "debug") {
			closedByUserRef.current = true;
		}
		setActiveModal(activeModal === "debug" ? "none" : "debug");
	};

	const handleClose = () => {
		closedByUserRef.current = true;
		setActiveModal("none");
	};

	const handleActionSubmit = async (
		actionType: "modify_player" | "room_action",
	) => {
		await handleSubmit(actionType);
		if (window.innerWidth < 1024) {
			handleClose();
		}
	};

	if (!isRendered) {
		return (
			<button
				onClick={toggleDebug}
				ref={triggerButtonRef}
				className={styles.debugButton}
				title="Consola de Depuración"
				aria-label="Abrir terminal de depuración"
				aria-haspopup="dialog"
				aria-expanded="false"
			>
				<FaBug
					className="w-4 h-4 md:w-5 md:h-5"
					aria-hidden="true"
				/>
			</button>
		);
	}

	const debugContent = (
		<div
			className="flex flex-col flex-1 min-h-0 w-full relative pt-2 font-mono"
			// --- ACCESIBILIDAD ---
			role="dialog"
			aria-modal="true"
			aria-labelledby="terminal-title"
		>
			{/* Botón cerrar estilo consola [X] */}
			<button
				ref={closeButtonRef}
				onClick={handleClose}
				className="absolute top-2 right-3 text-green-600 hover:text-green-300 font-bold text-lg p-1 transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-green-500"
				title="Cerrar terminal"
				aria-label="Cerrar terminal de depuración"
				disabled={isExiting}
			>
				[X]
			</button>

			{/* Cabecera Terminal */}
			<div className="px-5 pt-4 pb-3 shrink-0 border-b border-green-800/50">
				<h2
					id="terminal-title"
					className="text-lg text-green-500 tracking-tight flex items-center gap-2"
				>
					<span>Herramientas de Depuración</span>
				</h2>
				<p className="text-xs text-green-700 mt-1">
					Usuario:{" "}
					<strong className="text-green-400">{me?.name || "UNKNOWN"}</strong>
				</p>
			</div>

			{/* Contenido scrolleable */}
			<div
				className={`p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0 space-y-6 ${styles.customScroll}`}
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
					onSubmit={() => handleActionSubmit("modify_player")}
				/>

				<hr className="my-2 border-green-900/50 border-dashed" />

				{/* ─── ACCIONES DE SALA ─── */}
				<section className="space-y-4 bg-[#0a0f0a] border border-green-900/50 p-4 rounded text-green-500">
					<h3 className="font-bold text-sm flex items-center gap-2 text-green-400">
						<span className="uppercase tracking-widest">
							Acciones de Sala
						</span>
					</h3>

					<div className="space-y-2">
						<label className="text-xs font-semibold text-green-700 uppercase">
							 Seleccionar Victoria 
						</label>
						<div
							className="flex gap-2 flex-wrap"
							role="group"
							aria-label="Opciones de victoria forzada"
						>
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
											aria-pressed={debugState.roomActions.force_win === option}
											className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 ${
												debugState.roomActions.force_win === option
													? "bg-green-500 text-black border border-green-500"
													: "bg-transparent text-green-600 border border-green-800 hover:bg-green-900/40 hover:text-green-400 hover:border-green-600"
											}`}
										>
											{option === "cancelled" ? "Cancelada" : option}
										</button>
									),
							)}
						</div>
					</div>

					<button
						onClick={() => handleActionSubmit("room_action")}
						disabled={!debugState.roomActions.force_win || isSubmitting}
						className="w-full mt-4 px-3 py-2.5 bg-green-600 hover:bg-green-500 text-black text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-[#0d1117]"
					>
						{isSubmitting ? "Ejecutando..." : "Ejecutar(Victoria)"}
					</button>
				</section>
			</div>
		</div>
	);

	return (
		<>
			<button
				ref={triggerButtonRef}
				onClick={toggleDebug}
				className={styles.debugButton}
				title="Herramientas de Depuración"
				aria-label="Cerrar herramientas de depuración"
				aria-haspopup="dialog"
				aria-expanded="true"
			>
				<FaBug className="w-5 h-5 text-green-500" aria-hidden="true" />
			</button>

			{createPortal(
				<>
					{/* VERSIÓN MÓVIL */}
					<div
						ref={mobileContainerRef}
						className={`lg:hidden fixed inset-0 z-200 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 ${
							isExiting ? "opacity-0 transition-opacity" : ""
						}`}
						onClick={handleClose}
					>
						<div
							className={`${styles.terminalWindow} w-full h-full max-h-full`}
							onClick={(e) => e.stopPropagation()}
						>
							{debugContent}
						</div>
					</div>

					{/* VERSIÓN ESCRITORIO */}
					<div
						ref={desktopContainerRef}
						className={`hidden lg:block ${styles.desktopWrapper} ${
							isExiting ? styles.slideOutLeft : styles.slideInLeft
						}`}
					>
						<div
							className={`${styles.terminalWindow} w-96 h-[80vh] max-h-[80vh]`}
						>
							{debugContent}
						</div>
					</div>
				</>,
				document.body,
			)}
		</>
	);
}

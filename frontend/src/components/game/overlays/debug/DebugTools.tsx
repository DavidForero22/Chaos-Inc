// src/components/game/board/DebugTools.tsx
// Accesibilidad comprobada: SI

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGameUIStore } from "../../../../store/game/useGameUIStore.ts";
import { useGameStore } from "../../../../store/game/useGameStore.ts";
import { useRoomStore } from "../../../../store/room/useRoomStore.ts";
import { FaBug } from "react-icons/fa";
import styles from "./DebugTools.module.css";
import { useDebug } from "../../../../hooks/game/utils/useDebug";
import { PlayerModifier } from "./PlayerModifier";
import { useFocusTrap } from "../../../../hooks/ui/useFocusTrap.ts";
import { ROLE_LABELS } from "../../../../data/game/roles.ts";

interface DebugToolsProps {
	roomId: string;
}

const ROLES = ["boss", "secretary", "intern", "union"];

export function DebugTools({ roomId }: DebugToolsProps) {
	const activeModal = useGameUIStore((state) => state.activeModal);
	const setActiveModal = useGameUIStore((state) => state.setActiveModal);

	const me = useGameStore((state) => state.gameData?.me);
	const room = useRoomStore((state) => state.room);

	const [isRendered, setIsRendered] = useState(false);
	const [isExiting, setIsExiting] = useState(false);

	// --- Estado para detectar si es PC o Móvil ---
	const [isDesktop, setIsDesktop] = useState(
		typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
	);

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
	const activeContainerRef = useRef<HTMLDivElement>(null);

	// Solo atrapar el foco en el contenedor que esté activo
	useFocusTrap([activeContainerRef], activeModal === "debug");

	// Escuchar cambios de tamaño de pantalla
	useEffect(() => {
		const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// --- Escuchar la tecla Escape ---
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && activeModal === "debug" && !isExiting) {
				handleClose();
			}
		};

		if (activeModal === "debug") {
			document.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [activeModal, isExiting]);

	useEffect(() => {
		if (activeModal === "debug") {
			setIsRendered(true);
			setIsExiting(false);
			// Enfocar el botón de cerrar después de que el DOM se haya actualizado
			setTimeout(() => {
				closeButtonRef.current?.focus();
			}, 50);
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

	const isDebug = room?.is_debug;
	if (!isDebug) {
		return null;
	}

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
		if (!isDesktop) {
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
				<FaBug className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
			</button>
		);
	}

	const debugContent = (
		<div
			className="flex flex-col flex-1 min-h-0 w-full relative pt-2 font-mono"
			role="dialog"
			aria-modal="true"
			aria-labelledby="terminal-title"
		>
			{/* Botón cerrar  */}
			<button
				ref={closeButtonRef}
				onClick={handleClose}
				className="absolute top-2 right-3 text-green-600 hover:text-green-300 font-bold text-lg p-1 transition-colors z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
				title="Cerrar terminal"
				aria-label="Cerrar terminal de depuración"
				disabled={isExiting}
			>
				<span aria-hidden="true">[X]</span>
			</button>

			{/* Cabecera Terminal */}
			<div className="px-5 pt-4 pb-3 shrink-0 border-b border-green-800/50">
				<h2
					id="terminal-title"
					className="text-lg text-green-500 tracking-tight flex items-center gap-2 m-0"
				>
					<span>Herramientas de Depuración</span>
				</h2>
				<p className="text-xs text-green-700 mt-1 m-0">
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

				<section
					aria-labelledby="room-actions-title"
					className="space-y-4 bg-[#0a0f0a] border border-green-900/50 p-4 rounded text-green-500"
				>
					<h3
						id="room-actions-title"
						className="font-bold text-sm flex items-center gap-2 text-green-400 m-0"
					>
						<span className="uppercase tracking-widest">Acciones de Sala</span>
					</h3>

					<div className="space-y-2">
						<span
							id="force-win-label"
							className="text-xs font-semibold text-green-700 uppercase block"
						>
							Seleccionar Victoria
						</span>
						<div
							className="flex gap-2 flex-wrap"
							role="group"
							aria-labelledby="force-win-label"
						>
							{[...ROLES, "cancelled"].map(
								(option) =>
									option !== "secretary" && (
										<button
											key={option}
											type="button"
											onClick={() =>
												updateRoomAction(
													"force_win",
													debugState.roomActions.force_win === option
														? undefined
														: option,
												)
											}
											aria-pressed={debugState.roomActions.force_win === option}
											className={`px-3 py-1.5 text-xs font-bold capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
												debugState.roomActions.force_win === option
													? "bg-green-500 text-black border border-green-500"
													: "bg-transparent text-green-600 border border-green-800 hover:bg-green-900/40 hover:text-green-400 hover:border-green-600"
											}`}
										>
											{option === "cancelled"
												? "Cancelada"
												: ROLE_LABELS[option as keyof typeof ROLE_LABELS]}
										</button>
									),
							)}
						</div>
					</div>

					<button
						type="button"
						onClick={() => handleActionSubmit("room_action")}
						disabled={!debugState.roomActions.force_win || isSubmitting}
						className="w-full mt-4 px-3 py-2.5 bg-green-600 hover:bg-green-500 text-black text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f0a]"
					>
						{isSubmitting ? "Ejecutando..." : "Ejecutar (Victoria)"}
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
				// Renderizado Condicional: Solo existe un debugContent en el DOM a la vez
				isDesktop ? (
					/* VERSIÓN ESCRITORIO */
					<div
						ref={activeContainerRef}
						className={`${styles.desktopWrapper} ${
							isExiting ? styles.slideOutLeft : styles.slideInLeft
						}`}
					>
						<div
							className={`${styles.terminalWindow} w-96 h-[80vh] max-h-[80vh]`}
						>
							{debugContent}
						</div>
					</div>
				) : (
					/* VERSIÓN MÓVIL */
					<div
						ref={activeContainerRef}
						className={`fixed inset-0 z-200 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 ${
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
				),
				document.body,
			)}
		</>
	);
}

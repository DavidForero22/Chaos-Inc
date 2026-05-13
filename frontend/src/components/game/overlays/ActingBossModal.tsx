// src/components/game/modals/ActingBossModal.tsx

import { useEffect, useRef } from "react";
import { Modal } from "../ui/GameModal.tsx";

interface ActingBossModalProps {
	onClose: () => void;
}

export function ActingBossModal({ onClose }: ActingBossModalProps) {
	// --- ACCESIBILIDAD: Referencia para el foco inicial ---
	const confirmBtnRef = useRef<HTMLButtonElement>(null);

	// --- ACCESIBILIDAD: Inyectar el foco al montarse ---
	useEffect(() => {
		const timer = setTimeout(() => {
			confirmBtnRef.current?.focus();
		}, 50); // Micro-retraso para que el Modal esté renderizado en el DOM
		return () => clearTimeout(timer);
	}, []);

	return (
		<Modal maxWidth="max-w-md">
			<div
				className="flex flex-col gap-4 text-center"
				role="alert"
				aria-live="assertive"
				aria-labelledby="acting-boss-title"
				aria-describedby="acting-boss-desc"
			>
				<h2
					id="acting-boss-title"
					className="text-2xl font-black text-amber-400"
				>
					¡Jefe heredado!
				</h2>

				<p id="acting-boss-desc" className="text-sm text-gray-200">
					El jefe anterior se ha desconectado. Has heredado el cargo de jefe de
					forma temporal hasta que vuelva a conectarse.
				</p>

				<div className="mt-2 flex justify-center">
					<button
						ref={confirmBtnRef}
						onClick={onClose}
						className="px-6 py-2 rounded-md bg-amber-400 text-black font-black transition-colors hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
						aria-label="Cerrar aviso de nuevo cargo temporal"
					>
						ENTENDIDO
					</button>
				</div>
			</div>
		</Modal>
	);
}

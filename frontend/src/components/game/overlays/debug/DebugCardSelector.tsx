// src/components/game/overlays/debug/DebugCardSelector.tsx

import type { CardCatalogItem } from "../../../../types/api";

interface DebugCardSelectorProps {
	cardCatalog: CardCatalogItem[];
	isLoading: boolean;
	selectedCards: Record<number, number>; // { idCarta: cantidad }
	onUpdateQuantity: (cardId: number, change: number) => void;
}

export function DebugCardSelector({
	cardCatalog,
	isLoading,
	selectedCards,
	onUpdateQuantity,
}: DebugCardSelectorProps) {
	if (isLoading) {
		return (
			<div
				className="flex justify-center items-center h-24 bg-[#050a05] rounded-sm border border-green-900/50"
				role="status"
				aria-live="polite"
			>
				<span className="text-xs text-green-600 font-mono animate-pulse">
					&gt; Cargando catálogo_cartas...
				</span>
			</div>
		);
	}

	if (cardCatalog.length === 0) {
		return (
			<div
				className="flex justify-center items-center h-24 bg-red-900/10 rounded-sm border border-red-900/50"
				role="alert"
			>
				<span className="text-xs text-red-500 font-mono">
					&gt; ERR: Catálogo vacío o inaccesible.
				</span>
			</div>
		);
	}

	return (
		<div
			className="max-h-48 overflow-y-auto border border-green-900/50 rounded-sm bg-[#050a05] shadow-inner custom-scrollbar"
			// La clase custom-scrollbar del archivo general CSS se aplicará aquí
		>
			{cardCatalog.map((card) => {
				const currentQty = selectedCards[card.id] || 0;

				return (
					<div
						key={card.id}
						className={`flex justify-between items-center py-2 px-3 border-b border-green-900/30 last:border-0 transition-colors ${
							currentQty > 0 ? "bg-green-900/40" : "hover:bg-green-900/20"
						}`}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							<span className="text-xs font-mono text-green-500 truncate">
								<span className="text-green-800 font-normal mr-2">
									#{card.id}
								</span>
								{card.base_name}
							</span>
						</div>

						{/* --- ACCESIBILIDAD: Grupo lógico de botones para el lector --- */}
						<div
							className="flex items-center gap-2 shrink-0 ml-2"
							role="group"
							aria-label={`Cantidad de cartas: ${card.base_name}`}
						>
							<button
								onClick={() => onUpdateQuantity(card.id, -1)}
								disabled={currentQty === 0}
								aria-label={`Quitar carta ${card.base_name}`}
								className={`w-6 h-6 flex items-center justify-center rounded-sm text-black font-black leading-none focus:outline-none focus:ring-2 focus:ring-green-400 ${
									currentQty === 0
										? "bg-green-900/30 text-green-800 cursor-not-allowed"
										: "bg-green-700 hover:bg-green-500 text-black"
								}`}
							>
								-
							</button>

							<span
								className="w-5 text-center text-xs font-mono font-black text-green-400"
								aria-live="polite"
								aria-atomic="true"
							>
								{currentQty}
							</span>

							<button
								onClick={() => onUpdateQuantity(card.id, 1)}
								aria-label={`Añadir carta ${card.base_name}`}
								className="w-6 h-6 flex items-center justify-center rounded-sm bg-green-700 hover:bg-green-500 text-black font-black leading-none focus:outline-none focus:ring-2 focus:ring-green-400"
							>
								+
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}

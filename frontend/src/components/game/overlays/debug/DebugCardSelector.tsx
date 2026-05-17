// src/components/game/overlays/debug/DebugCardSelector.tsx
// Accesibilidad comprobada: SI

import type { CardCatalogItem } from "../../../../types/api";
import srOnlyStyles from "../../../../styles/sr-only.module.css";

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
					Cargando cartas...
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
					No se han podido cargar las cartas.
				</span>
			</div>
		);
	}

	return (
		<ul
			aria-label="Catálogo de cartas disponibles"
			className="max-h-48 overflow-y-auto border border-green-900/50 rounded-sm bg-[#050a05] shadow-inner custom-scrollbar m-0 p-0 list-none"
		>
			{cardCatalog.map((card) => {
				const currentQty = selectedCards[card.id] || 0;

				return (
					<li
						key={card.id}
						className={`flex justify-between items-center py-2 px-3 border-b border-green-900/30 last:border-0 transition-colors ${
							currentQty > 0 ? "bg-green-900/40" : "hover:bg-green-900/20"
						}`}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							<span className="text-xs font-mono text-green-500 truncate">
								<span
									aria-hidden="true"
									className="text-green-800 font-normal mr-2"
								>
									#{card.id}
								</span>
								{card.base_name}
							</span>
						</div>

						<div
							className="flex items-center gap-2 shrink-0 ml-2"
							role="group"
							aria-label={`Ajustar cantidad de: ${card.base_name}`}
						>
							<button
								type="button"
								onClick={() => onUpdateQuantity(card.id, -1)}
								disabled={currentQty === 0}
								aria-label={`Quitar una carta de ${card.base_name}`}
								className={`w-6 h-6 flex items-center justify-center rounded-sm text-black font-black leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
									currentQty === 0
										? "bg-green-900/30 text-green-800 cursor-not-allowed"
										: "bg-green-700 hover:bg-green-500 text-black"
								}`}
							>
								<span aria-hidden="true">-</span>
							</button>

							<span
								className="w-5 text-center text-xs font-mono font-black text-green-400"
								aria-live="polite"
								aria-atomic="true"
							>
								{/* Contexto adicional solo para voz */}
								<span className={srOnlyStyles.srOnly}>Cantidad actual: </span>
								{currentQty}
							</span>

							<button
								type="button"
								onClick={() => onUpdateQuantity(card.id, 1)}
								aria-label={`Añadir una carta de ${card.base_name}`}
								className="w-6 h-6 flex items-center justify-center rounded-sm bg-green-700 hover:bg-green-500 text-black font-black leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
							>
								<span aria-hidden="true">+</span>
							</button>
						</div>
					</li>
				);
			})}
		</ul>
	);
}

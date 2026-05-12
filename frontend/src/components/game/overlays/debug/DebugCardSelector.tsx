// src/components/game/overlays/debug/DebugCardSelector.tsx

import type { CardCatalogItem } from "../../../../hooks/game/useDebug";

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
			<div className="flex justify-center items-center h-24 bg-white/50 rounded border border-gray-300">
				<span className="text-xs text-gray-500 font-bold animate-pulse">
					Cargando cartas...
				</span>
			</div>
		);
	}

	if (cardCatalog.length === 0) {
		return (
			<div className="flex justify-center items-center h-24 bg-red-50 rounded border border-red-200">
				<span className="text-xs text-red-500 font-bold">
					Error cargando cartas
				</span>
			</div>
		);
	}

	return (
		<div className="max-h-48 overflow-y-auto border border-gray-300 rounded bg-white shadow-inner custom-scrollbar">
			{cardCatalog.map((card) => {
				const currentQty = selectedCards[card.id] || 0;

				return (
					<div
						key={card.id}
						className={`flex justify-between items-center py-1.5 px-2 border-b border-gray-200 last:border-0 transition-colors ${currentQty > 0 ? "bg-blue-50" : "hover:bg-gray-50"}`}
					>
						<div className="flex items-center gap-2 overflow-hidden">
							<span className="text-xs font-bold text-gray-700 truncate">
								<span className="text-gray-400 font-normal mr-1">
									#{card.id}
								</span>
								{card.base_name}
							</span>
						</div>

						<div className="flex items-center gap-1.5 shrink-0 ml-2">
							<button
								onClick={() => onUpdateQuantity(card.id, -1)}
								disabled={currentQty === 0}
								className={`w-6 h-6 flex items-center justify-center rounded text-white font-bold leading-none ${currentQty === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500 hover:bg-gray-600"}`}
							>
								-
							</button>
							<span className="w-5 text-center text-xs font-black text-blue-800">
								{currentQty}
							</span>
							<button
								onClick={() => onUpdateQuantity(card.id, 1)}
								className="w-6 h-6 flex items-center justify-center rounded bg-blue-500 hover:bg-blue-600 text-white font-bold leading-none"
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

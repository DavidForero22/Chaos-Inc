// src/components/game/board/PlayerModifier.tsx

import { RiUserStarLine, RiHeartLine, RiSkullLine } from "react-icons/ri";
import { DebugCardSelector } from "./DebugCardSelector";
import type { CardCatalogItem } from "../../../../types/api";

interface PlayerModifierProps {
	playerRole: string | undefined;
	debugState: {
		playerModifications: {
			set_stress?: number;
			add_cards?: Record<number, number>;
			set_is_dead?: boolean;
		};
	};
	isSubmitting: boolean;
	cardCatalog: CardCatalogItem[];
	isLoadingCatalog: boolean;
	onUpdateStress: (level: number | undefined) => void;
	onUpdateCardQuantity: (cardId: number, change: number) => void;
	onUpdateIsDead: (isDead: boolean | undefined) => void;
	onSubmit: () => void;
}

export function PlayerModifier({
	playerRole,
	debugState,
	isSubmitting,
	cardCatalog,
	isLoadingCatalog,
	onUpdateStress,
	onUpdateCardQuantity,
	onUpdateIsDead,
	onSubmit,
}: PlayerModifierProps) {
	// Determinar estrés máximo según rol actual
	const maxStress = playerRole === "boss" ? 4 : 3;
	const stressLevels = Array.from({ length: maxStress + 1 }, (_, i) => i);

	return (
		<section className="space-y-3 bg-white/40 p-3 rounded-lg">
			<h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
				<RiUserStarLine className="w-4 h-4" /> Modificar Jugador
			</h3>

			{/* Estrés */}
			<div className="space-y-1">
				<label className="text-xs font-semibold text-gray-700">
					Nivel de Estrés (máx: {maxStress})
				</label>
				<div className="flex gap-2 flex-wrap">
					{stressLevels.map((level) => (
						<button
							key={level}
							onClick={() => onUpdateStress(level)}
							className={`px-2 py-1 text-xs rounded border transition-colors ${
								debugState.playerModifications.set_stress === level
									? "bg-red-500 text-white border-red-600"
									: "bg-white text-gray-700 border-gray-300 hover:bg-red-100"
							}`}
						>
							{level}
						</button>
					))}
					<button
						onClick={() => onUpdateStress(undefined)}
						className="px-2 py-1 text-xs rounded border bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
					>
						✕
					</button>
				</div>
			</div>

			{/* Vida / Muerte */}
			<div className="space-y-1">
				<label className="text-xs font-semibold text-gray-700">
					Estado Vital
				</label>
				<div className="flex gap-2">
					<button
						onClick={() => onUpdateIsDead(false)}
						className={`flex-1 px-3 py-2 text-xs font-bold rounded border transition-colors flex items-center justify-center gap-1 ${
							debugState.playerModifications.set_is_dead === false
								? "bg-green-500 text-white border-green-600"
								: "bg-white text-gray-700 border-gray-300 hover:bg-green-100"
						}`}
					>
						<RiHeartLine className="w-4 h-4" />
						Vivo
					</button>
					<button
						onClick={() => onUpdateIsDead(true)}
						className={`flex-1 px-3 py-2 text-xs font-bold rounded border transition-colors flex items-center justify-center gap-1 ${
							debugState.playerModifications.set_is_dead === true
								? "bg-red-600 text-white border-red-700"
								: "bg-white text-gray-700 border-gray-300 hover:bg-red-100"
						}`}
					>
						<RiSkullLine className="w-4 h-4" />
						Muerto
					</button>
					<button
						onClick={() => onUpdateIsDead(undefined)}
						className="px-3 py-2 text-xs rounded border bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
						title="Limpiar selección"
					>
						✕
					</button>
				</div>
			</div>

			{/* Añadir cartas */}
			<div className="space-y-1">
				<label className="text-xs font-semibold text-gray-700">
					Añadir Cartas
				</label>
				<DebugCardSelector
					cardCatalog={cardCatalog}
					isLoading={isLoadingCatalog}
					selectedCards={debugState.playerModifications.add_cards || {}}
					onUpdateQuantity={onUpdateCardQuantity}
				/>
			</div>

			<button
				onClick={onSubmit}
				disabled={isSubmitting}
				className="w-full mt-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
			>
				{isSubmitting ? "Aplicando..." : "Aplicar Modificaciones"}
			</button>
		</section>
	);
}

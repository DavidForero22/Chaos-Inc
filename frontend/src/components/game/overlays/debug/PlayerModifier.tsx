// src/components/game/board/PlayerModifier.tsx
// Accesibilidad comprobada: SI

import { RiHeartLine, RiSkullLine } from "react-icons/ri";
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
	const maxStress = playerRole === "boss" ? 4 : 3;
	const stressLevels = Array.from({ length: maxStress + 1 }, (_, i) => i);

	return (
		<section
			aria-labelledby="modifier-title"
			className="space-y-4 bg-[#0a0f0a] border border-green-900/50 p-4 rounded text-green-500"
		>
			<h3
				id="modifier-title"
				className="font-bold text-sm flex items-center gap-2 text-green-400 uppercase tracking-widest m-0"
			>
				Modificar Jugador
			</h3>

			{/* Estrés */}
			<div className="space-y-2">
				<span
					id="label-stress"
					className="text-xs font-semibold text-green-700 uppercase block"
				>
					Nivel de Estrés (máx: {maxStress})
				</span>
				<div
					className="flex gap-2 flex-wrap"
					role="group"
					aria-labelledby="label-stress"
				>
					{stressLevels.map((level) => (
						<button
							key={level}
							type="button"
							onClick={() => onUpdateStress(level)}
							aria-pressed={debugState.playerModifications.set_stress === level}
							className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
								debugState.playerModifications.set_stress === level
									? "bg-green-500 text-black border-green-500"
									: "bg-transparent text-green-600 border-green-800 hover:bg-green-900/40 hover:text-green-400 hover:border-green-600"
							}`}
						>
							{level}
						</button>
					))}
					<button
						type="button"
						onClick={() => onUpdateStress(undefined)}
						aria-label="Restaurar estrés por defecto"
						className="px-3 py-1.5 text-xs font-bold rounded-sm border bg-transparent text-green-800 border-green-900 hover:bg-red-900/30 hover:text-red-500 hover:border-red-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
					>
						<span aria-hidden="true">X</span>
					</button>
				</div>
			</div>

			{/* Vida / Muerte */}
			<div className="space-y-2">
				<span
					id="label-vital"
					className="text-xs font-semibold text-green-700 uppercase block"
				>
					ESTADO
				</span>
				<div className="flex gap-2" role="group" aria-labelledby="label-vital">
					<button
						type="button"
						onClick={() => onUpdateIsDead(false)}
						aria-pressed={debugState.playerModifications.set_is_dead === false}
						className={`flex-1 px-3 py-2 text-xs font-bold rounded-sm border transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
							debugState.playerModifications.set_is_dead === false
								? "bg-green-500 text-black border-green-500"
								: "bg-transparent text-green-600 border-green-800 hover:bg-green-900/40 hover:text-green-400 hover:border-green-600"
						}`}
					>
						<RiHeartLine className="w-4 h-4" aria-hidden="true" />
						VIVO
					</button>
					<button
						type="button"
						onClick={() => onUpdateIsDead(true)}
						aria-pressed={debugState.playerModifications.set_is_dead === true}
						className={`flex-1 px-3 py-2 text-xs font-bold rounded-sm border transition-colors flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
							debugState.playerModifications.set_is_dead === true
								? "bg-red-600 text-black border-red-600"
								: "bg-transparent text-red-700 border-red-900 hover:bg-red-900/20 hover:text-red-500 hover:border-red-800"
						}`}
					>
						<RiSkullLine className="w-4 h-4" aria-hidden="true" />
						MUERTO
					</button>
					<button
						type="button"
						onClick={() => onUpdateIsDead(undefined)}
						aria-label="Restaurar estado vital por defecto"
						className="px-3 py-2 text-xs font-bold rounded-sm border bg-transparent text-green-800 border-green-900 hover:bg-red-900/30 hover:text-red-500 hover:border-red-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
					>
						<span aria-hidden="true">X</span>
					</button>
				</div>
			</div>

			{/* Añadir cartas */}
			<div className="space-y-2">
				<span
					id="label-cards"
					className="text-xs font-semibold text-green-700 uppercase block"
				>
					Agregar Cartas
				</span>
				<div aria-labelledby="label-cards">
					<DebugCardSelector
						cardCatalog={cardCatalog}
						isLoading={isLoadingCatalog}
						selectedCards={debugState.playerModifications.add_cards || {}}
						onUpdateQuantity={onUpdateCardQuantity}
					/>
				</div>
			</div>

			<button
				type="button"
				onClick={onSubmit}
				disabled={isSubmitting}
				aria-busy={isSubmitting}
				className="w-full mt-4 px-3 py-2.5 bg-green-600 hover:bg-green-500 text-black text-xs font-black uppercase tracking-widest rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117]"
			>
				{isSubmitting ? "Ejecutando..." : "Ejecutar (Jugador)"}
			</button>
		</section>
	);
}

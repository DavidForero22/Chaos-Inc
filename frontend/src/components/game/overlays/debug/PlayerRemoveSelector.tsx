// src/components/game/board/PlayerRemoveSelector.tsx

import { RiUserMinusLine, RiCloseLine, RiCheckLine } from "react-icons/ri";

interface PlayerRemoveSelectorProps {
	opponents: Array<{
		id: string;
		name: string;
		is_dead: boolean;
	}>;
	isRemoveMode: boolean;
	playersToRemove: string[];
	isSubmitting: boolean;
	onToggleRemoveMode: () => void;
	onTogglePlayer: (playerId: string) => void;
	onConfirmRemove: () => void;
}

export function PlayerRemoveSelector({
	opponents,
	isRemoveMode,
	playersToRemove,
	isSubmitting,
	onToggleRemoveMode,
	onTogglePlayer,
	onConfirmRemove,
}: PlayerRemoveSelectorProps) {
	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<button
					onClick={onToggleRemoveMode}
					className={`flex-1 px-3 py-2 text-xs font-bold rounded transition-colors ${
						isRemoveMode
							? "bg-gray-500 hover:bg-gray-600 text-white"
							: "bg-red-600 hover:bg-red-700 text-white"
					} disabled:opacity-50`}
					disabled={isSubmitting}
				>
					{isRemoveMode ? (
						<span className="flex items-center justify-center gap-1">
							<RiCloseLine className="w-4 h-4" />
							Cancelar
						</span>
					) : (
						<span className="flex items-center justify-center gap-1">
							<RiUserMinusLine className="w-4 h-4" />
							Borrar Jugadores
						</span>
					)}
				</button>

				{isRemoveMode && (
					<button
						onClick={onConfirmRemove}
						disabled={playersToRemove.length === 0 || isSubmitting}
						className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span className="flex items-center justify-center gap-1">
							<RiCheckLine className="w-4 h-4" />
							{isSubmitting
								? "Eliminando..."
								: `Confirmar (${playersToRemove.length})`}
						</span>
					</button>
				)}
			</div>

			{isRemoveMode && (
				<div className="bg-white/60 rounded p-2 max-h-32 overflow-y-auto space-y-1">
					{opponents.length === 0 ? (
						<p className="text-xs text-gray-500 text-center py-2">
							No hay jugadores disponibles para eliminar
						</p>
					) : (
						opponents.map((player) => (
							<label
								key={player.id}
								className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
									player.is_dead
										? "opacity-50 cursor-not-allowed"
										: playersToRemove.includes(player.id)
											? "bg-red-100 border border-red-300"
											: "hover:bg-gray-100 border border-transparent"
								}`}
							>
								<input
									type="checkbox"
									checked={playersToRemove.includes(player.id)}
									onChange={() => onTogglePlayer(player.id)}
									disabled={player.is_dead}
									className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
								/>
								<div className="flex-1 min-w-0">
									<span className="text-xs font-semibold text-gray-800 truncate block">
										{player.name}
									</span>
									<span className="text-[10px] text-gray-500">
										ID: {player.id}
									</span>
								</div>
								{player.is_dead && (
									<span className="text-[10px] text-red-600 font-bold">
										MUERTO
									</span>
								)}
								{playersToRemove.includes(player.id) && (
									<RiCloseLine className="w-4 h-4 text-red-600" />
								)}
							</label>
						))
					)}
				</div>
			)}
		</div>
	);
}

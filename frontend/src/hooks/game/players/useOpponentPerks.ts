import type { Opponent } from "../../../types/live-game";
import { useDisplayPerks } from "./useDisplayPerks";

export function useOpponentPerks(player: Opponent) {
	// Adiós a todo el código duplicado
	return useDisplayPerks(player.perks);
}

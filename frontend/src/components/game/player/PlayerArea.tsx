import { useEffect } from "react";
import { useGameStore } from "../../../store/useGameStore.ts";
import { useGameUIStore } from "../../../store/useGameUIStore.ts";
import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import { PlayerBanners } from "./PlayerBanners.tsx";
import { PlayerActions } from "./PlayerActions.tsx";

export function PlayerArea() {
	// Datos del servidor (Solo lo necesario para el montaje)
	const me = useGameStore((state) => state.gameData?.me);

	// Control de UI
	const { isDiscardMode, setIsDiscardMode, clearDiscardSelection } =
		useGameUIStore();

	// Forzar modo descarte cuando el jugador es saboteado
	useEffect(() => {
		if (!me) return;

		if (me.conditions.must_discard && !isDiscardMode) {
			setIsDiscardMode(true);
		}

		if (
			!me.conditions.must_discard &&
			isDiscardMode &&
			me.cards.length <= me.max_hand_size
		) {
			// Solo cerramos si no está obligado a descartar y está por debajo del límite.
			clearDiscardSelection();
		}
	}, [me?.conditions.must_discard]);

	if (!me) return null;

	return (
		<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end relative">
			<PlayerBanners me={me}/>

			<PlayerStats me={me} />

			<PlayerHand />

			<PlayerActions />
		</div>
	);
}

// frontend/src/hooks/game/useCardPlayability.ts
import { useMemo } from "react";
import type { CardInstance, GameData } from "../../types/live-game";

export function useCardPlayability(
	gameData: GameData,
	myPlayerName: string,
	isDiscardMode: boolean,
) {
	const { me, game } = gameData;
	const { opponents, current_turn } = game;

	// --- CONDICIONES GLOBALES CALCULADAS UNA SOLA VEZ ---
	const globalConditions = useMemo(() => {
		const myRange = me.perks.vision_range ?? 1;
		const isMyTurn = current_turn === myPlayerName;
		const incomingAttack = me.combat_state.is_defending_single;
		const hasPendingMultiAttack = me.combat_state.is_defending_multi;
		const hasPendingAttack = me.combat_state.is_attacking_single;
		const isAttackerWaiting = me.combat_state.is_attacking_multi;
		const hasPendingSabotage =
			!!game.player_pending_sabotage &&
			game.player_pending_sabotage !== myPlayerName;
		const hasLuckChallenge = isMyTurn && !!me.luck_challenge;

		const anyOpponentHasCards = opponents.some(
			(o) => o.cards_count > 0 && o.is_online,
		);
		const anyoneHasStress =
			opponents.some((o) => !o.is_dead && o.stress > 0) || me.stress > 0;
		const isAnyOpponentInRange = opponents.some(
			(o) => !o.is_dead && o.is_online && o.distance <= myRange,
		);
		const anyOpponentHasPerks = opponents.some(
			(o) =>
				!o.is_dead &&
				o.is_online &&
				(o.perks.has_shield ||
					o.perks.vision_bonus > 0 ||
					o.perks.distance_bonus > 0),
		);

		return {
			isMyTurn,
			incomingAttack,
			hasPendingMultiAttack,
			hasPendingAttack,
			isAttackerWaiting,
			hasPendingSabotage,
			hasLuckChallenge,
			anyOpponentHasCards,
			anyoneHasStress,
			isAnyOpponentInRange,
			anyOpponentHasPerks,
		};
	}, [me, opponents, current_turn, myPlayerName]);

	// --- FUNCIÓN EVALUADORA POR CARTA ---
	const evaluateCard = (card: CardInstance) => {
		const {
			isMyTurn,
			incomingAttack,
			hasPendingMultiAttack,
			hasPendingAttack,
			isAttackerWaiting,
			hasPendingSabotage,
			anyOpponentHasCards,
			anyoneHasStress,
			isAnyOpponentInRange,
			anyOpponentHasPerks,
		} = globalConditions;

		// Evaluar si la carta está deshabilitada por reglas de juego
		const isHealDisabled = card.type === 2 && me.stress <= 0;
		const isAttackDisabled =
			card.type === 1 &&
			(me.turn_limits.single_attack_used || !isAnyOpponentInRange);
		const isAttackAllDisabled =
			card.type === 7 && me.turn_limits.multi_attack_used;
		const isDodgeDisabled =
			card.type === 3 && !incomingAttack && !hasPendingMultiAttack;
		const isStealDisabled = card.type === 4 && !anyOpponentHasCards;
		const isShieldDisabled = card.type === 5 && me.perks.has_shield;
		const isHealAllDisabled = card.type === 8 && !anyoneHasStress;
		const isSabotageDisabled =
			card.type === 9 &&
			!opponents.some((o) => !o.is_dead && o.is_online && o.cards_count > 0);
		const isBlockDisabled =
			card.type === 6 &&
			!opponents.some((o) => {
				const isBlocked = o.conditions?.is_blocked ?? (o as any).is_blocked;
				return !o.is_dead && o.is_online && !isBlocked;
			});
		const isVisionDisabled =
			card.type === 10 && (me.perks.vision_bonus ?? 0) >= 2;
		const isDistanceDisabled =
			card.type === 11 && (me.perks.distance_bonus ?? 0) >= 1;
		const isAuditDisabled = card.type === 12 && !anyOpponentHasPerks;

		const isDisabled =
			isHealDisabled ||
			isAttackDisabled ||
			isDodgeDisabled ||
			isStealDisabled ||
			isShieldDisabled ||
			isBlockDisabled ||
			isHealAllDisabled ||
			isAttackAllDisabled ||
			isSabotageDisabled ||
			isVisionDisabled ||
			isDistanceDisabled ||
			isAuditDisabled;

		// Evaluar condiciones especiales
		const canUseDodgeNow =
			(incomingAttack || hasPendingMultiAttack) && card.type === 3;

		// Evaluar si se puede hacer clic (seleccionar/jugar)
		const isSelectable = isDiscardMode
			? true
			: (isMyTurn &&
					!isDisabled &&
					!hasPendingAttack &&
					!isAttackerWaiting &&
					!hasPendingSabotage) ||
				canUseDodgeNow;

		return {
			isDisabled,
			canUseDodgeNow,
			isSelectable,
			globalConditions,
		};
	};

	return { evaluateCard, globalConditions };
}

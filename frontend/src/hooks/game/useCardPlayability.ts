// frontend/src/hooks/game/useCardPlayability.ts
import { useMemo } from "react";
import type { CardInstance, GameData } from "../../types/live-game";

export function useCardPlayability(
	gameData: GameData,
	myPlayerId: string,
	isDiscardMode: boolean,
) {
	const { me, game } = gameData;
	const { opponents, current_turn } = game;

	// --- CONDICIONES GLOBALES CALCULADAS UNA SOLA VEZ ---
	const globalConditions = useMemo(() => {
		const myRange = me.perks.vision_range ?? 1;
		const isMyTurn = String(current_turn) === String(myPlayerId);

		const incomingAttack = me.combat_state.is_defending_single;
		const hasPendingMultiAttack = me.combat_state.is_defending_multi;
		const hasPendingAttack = me.combat_state.is_attacking_single;
		const isAttackerWaiting = me.combat_state.is_attacking_multi;
		const hasPendingSabotage =
			!!game.player_pending_sabotage &&
			game.player_pending_sabotage !== myPlayerId;
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
					o.perks.has_distance ||
					o.perks.has_luck),
		);

		const myActivePerksCount =
			(me.perks.has_shield ? 1 : 0) +
			((me.perks.vision_bonus ?? 0) > 0 ? 1 : 0) +
			(me.perks.has_distance ? 1 : 0) +
			(me.perks.has_storage ? 1 : 0) +
			(me.perks.has_luck ? 1 : 0);

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
			myActivePerksCount,
		};
	}, [me, opponents, current_turn, myPlayerId]);

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
			myActivePerksCount,
		} = globalConditions;

		// Evaluar si la carta está deshabilitada por reglas de juego usando card_id
		const isHealDisabled = card.card_id === 2 && me.stress <= 0;
		const isAttackDisabled =
			card.card_id === 1 &&
			(me.turn_limits.single_attack_used || !isAnyOpponentInRange);
		const isAttackAllDisabled =
			card.card_id === 7 && me.turn_limits.multi_attack_used;
		const isDodgeDisabled =
			card.card_id === 3 && !incomingAttack && !hasPendingMultiAttack;
		const isStealDisabled = card.card_id === 4 && !anyOpponentHasCards;
		const isHealAllDisabled = card.card_id === 8 && !anyoneHasStress;
		const isSabotageDisabled =
			card.card_id === 9 &&
			!opponents.some((o) => !o.is_dead && o.is_online && o.cards_count > 0);
		const isBlockDisabled =
			card.card_id === 6 &&
			!opponents.some((o) => {
				const isBlocked = o.conditions?.is_blocked ?? (o as any).is_blocked;
				return !o.is_dead && o.is_online && !isBlocked;
			});
		const isCleanDisabled = card.card_id === 12 && !anyOpponentHasPerks;

		let isPerkLimitReached = false;
		if ([5, 11, 13, 14].includes(card.card_id)) {
			// Escudo, Lejanía o Deposito: bloqueados si tiene 3 slots llenos
			isPerkLimitReached = myActivePerksCount >= 3;
		} else if (card.card_id === 10) {
			// Visión: bloqueada por límite solo si NO la tenía ya (va a ocupar hueco nuevo)
			isPerkLimitReached =
				myActivePerksCount >= 3 && (me.perks.vision_bonus ?? 0) === 0;
		}

		const isShieldDisabled =
			(card.card_id === 5 && me.perks.has_shield) || isPerkLimitReached;
		const isVisionDisabled =
			(card.card_id === 10 && (me.perks.vision_bonus ?? 0) >= 2) ||
			isPerkLimitReached;
		const isDistanceDisabled =
			(card.card_id === 11 && me.perks.has_distance) || isPerkLimitReached;
		const isStorageDisabled =
			(card.card_id === 13 && me.perks.has_storage) || isPerkLimitReached;
		const isLuckDisabled =
			(card.card_id === 14 && me.perks.has_luck) || isPerkLimitReached;

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
			isCleanDisabled ||
			isStorageDisabled ||
			isLuckDisabled;

		// Evaluar condiciones especiales
		const canUseDodgeNow =
			(incomingAttack || hasPendingMultiAttack) && card.card_id === 3;

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

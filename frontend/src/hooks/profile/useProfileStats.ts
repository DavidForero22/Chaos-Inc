import { useMemo } from "react";
import type { GameRecord } from "../../types/api.ts";

export interface BasicStats {
	wins: number;
	damage: number;
	received: number;
	healing: number;
	cards: number;
	passives: number;
	eliminations: number;
	dodgedAttacks: number;
	cardsStolen: number;
}

export interface RoleEntry {
	role: string;
	count: number;
}
export interface WinrateEntry {
	role: string;
	winrate: number;
	total: number;
}
export interface CardEntry {
	id: number;
	name: string;
	count: number;
}

export interface ProfileStats {
	basicStats: BasicStats;
	radarData: number[]; // [DañoInfligido, DañoRecibido, CuraciónRealizada, Eliminaciones, Pasivas]
	roleDistribution: RoleEntry[];
	winrateByRole: WinrateEntry[];
	topCards: CardEntry[];
	aliveDeadData: { alive: number; dead: number };
	totalGames: number;
}

const EMPTY: ProfileStats = {
	basicStats: {
		wins: 0,
		damage: 0,
		received: 0,
		healing: 0,
		cards: 0,
		passives: 0,
		eliminations: 0,
		dodgedAttacks: 0,
		cardsStolen: 0,
	},
	radarData: [0, 0, 0, 0, 0],
	roleDistribution: [],
	winrateByRole: [],
	topCards: [],
	aliveDeadData: { alive: 0, dead: 0 },
	totalGames: 0,
};

const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

export function useProfileStats(
	games: GameRecord[],
	user: string | null | undefined,
): ProfileStats {
	return useMemo(() => {
		if (!user || games.length === 0) return EMPTY;

		// Filtrar solo partidas donde el usuario participó
		const myGames = games.flatMap((game) => {
			const me = game.players.find((p) => p.displayName === user);
			return me ? [{ game, me }] : [];
		});

		const n = myGames.length;
		if (n === 0) return EMPTY;

		// ── Basic Stats ───────────────────────────────────────────────
		const basicStats = myGames.reduce<BasicStats>(
			(acc, { me }) => ({
				wins: acc.wins + (me.stats.hasWon ? 1 : 0),
				damage: acc.damage + me.stats.damageDealt,
				received: acc.received + me.stats.damageReceived,
				healing: acc.healing + me.stats.healingDone,
				cards: acc.cards + me.stats.cardsPlayed,
				passives: acc.passives + me.stats.passivesPlayed,
				eliminations: acc.eliminations + me.stats.eliminations,
				dodgedAttacks: acc.dodgedAttacks + (me.stats.dodgedAttacks ?? 0),
				cardsStolen: acc.cardsStolen + (me.stats.cardsStolen ?? 0),
			}),
			{
				wins: 0,
				damage: 0,
				received: 0,
				healing: 0,
				cards: 0,
				passives: 0,
				eliminations: 0,
				dodgedAttacks: 0,
				cardsStolen: 0,
			},
		);

		// ── Radar  ──────────────────
		const radarRaw = [
			basicStats.damage,
			basicStats.passives,
			basicStats.cardsStolen,
			basicStats.healing,
			basicStats.dodgedAttacks,
		];

		const maxVal = Math.max(...radarRaw, 1);
		const radarData = radarRaw.map((v) => clamp((v / maxVal) * 100));

		// ── Distribución de roles ─────────────────────────────────────
		const roleCounts: Record<string, number> = {};
		myGames.forEach(({ me }) => {
			roleCounts[me.stats.role] = (roleCounts[me.stats.role] ?? 0) + 1;
		});
		const roleDistribution = Object.entries(roleCounts)
			.map(([role, count]) => ({ role, count }))
			.sort((a, b) => b.count - a.count);

		// ── Winrate por rol ───────────────────────────────────────────
		const roleWins: Record<string, { wins: number; total: number }> = {};
		myGames.forEach(({ me }) => {
			const r = me.stats.role;
			if (!roleWins[r]) roleWins[r] = { wins: 0, total: 0 };
			roleWins[r].total++;
			if (me.stats.hasWon) roleWins[r].wins++;
		});
		const winrateByRole = Object.entries(roleWins).map(
			([role, { wins, total }]) => ({
				role,
				winrate: Math.round((wins / total) * 100),
				total,
			}),
		);

		// ── Top 5 cartas ──────────────────────────────────────────────
		const cardTotals: Record<number, { count: number; name: string }> = {};
		myGames.forEach(({ me }) => {
			me.cardUsages?.forEach(({ cardId, name, timesPlayed }) => {
				if (!cardTotals[cardId]) {
					// Si es la primera vez que vemos esta carta, inicializamos su contador y guardamos su nombre
					cardTotals[cardId] = {
						count: 0,
						name: name ?? `Carta #${cardId}`,
					};
				}
				// Sumamos los usos
				cardTotals[cardId].count += timesPlayed;
			});
		});
		const topCards = Object.entries(cardTotals)
			.map(([id, data]) => ({
				id: Number(id),
				name: data.name, 
				count: data.count,
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// ── Vivo vs Muerto ────────────────────────────────────────────
		const dead = myGames.filter(({ me }) => me.stats.isDead).length;
		const aliveDeadData = { alive: n - dead, dead };

		return {
			basicStats,
			radarData,
			roleDistribution,
			winrateByRole,
			topCards,
			aliveDeadData,
			totalGames: n,
		};
	}, [games, user]);
}

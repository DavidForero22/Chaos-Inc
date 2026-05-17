export interface XpBreakdown {
	base: number;
	eliminations: {
		count: number;
		xp: number;
	};
	mvp: number; // 0 si no fue MVP
}

export interface XpAccount {
	total_xp: number;
	level: number;
	xp_current: number; // XP acumulado dentro del nivel actual
	xp_needed: number; // Coste total del nivel actual (para la barra)
}

export interface XpSummary {
	breakdown: XpBreakdown;
	total_earned: number;
	account: XpAccount | null; // null para guests
}

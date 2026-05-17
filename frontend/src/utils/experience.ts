// Mismas constantes que ExperienceService.php
const LEVEL_BASE = 50;
const LEVEL_EXPONENT = 1.5;
const MAX_LEVEL = 50;

export function xpRequiredForLevel(level: number): number {
	return Math.round(LEVEL_BASE * Math.pow(level, LEVEL_EXPONENT));
}

export function totalXpForLevel(level: number): number {
	let total = 0;
	for (let i = 1; i < level; i++) {
		total += xpRequiredForLevel(i);
	}
	return total;
}

export function levelFromXp(totalXp: number): number {
	let level = 1;
	let accumulated = 0;

	while (level < MAX_LEVEL) {
		const cost = xpRequiredForLevel(level);
		if (accumulated + cost > totalXp) break;
		accumulated += cost;
		level++;
	}

	return level;
}

export function getLevelProgress(totalXp: number): {
	level: number;
	xpCurrent: number;
	xpNeeded: number;
	percent: number;
	isMaxLevel: boolean;
} {
	const level = levelFromXp(totalXp);
	const isMaxLevel = level >= MAX_LEVEL;
	const floor = totalXpForLevel(level);
	const next = isMaxLevel ? floor : totalXpForLevel(level + 1);
	const xpNeeded = next - floor;
	const xpCurrent = totalXp - floor;
	const percent = isMaxLevel
		? 100
		: Math.min(100, Math.round((xpCurrent / xpNeeded) * 100));

	return { level, xpCurrent, xpNeeded, percent, isMaxLevel };
}

export function getRankLabel(level: number): string {
	if (level <= 10) return "Becario";
	if (level <= 25) return "Empleado del Mes";
	return "CEO Legendario";
}

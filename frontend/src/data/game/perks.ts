export const PERKS_DICTIONARY: Record<
	string,
	{ icon: string; title: string; cardType: number; name: string }
> = {
	has_shield: {
		icon: "🛡️",
		title: "El siguiente ataque será bloqueado",
		cardType: 5,
		name: "Escudo",
	},
	has_distance: {
		icon: "💻",
		title: "Los demás te ven a +1 de alcance",
		cardType: 11,
		name: "Teletrabajo",
	},
	has_storage: {
		icon: "🎒",
		title: "Límite de cartas en mano +1",
		cardType: 13,
		name: "Riñonera",
	},
	has_luck: {
		icon: "🍀",
		title: "50% de tomar una carta extra al inicio del turno.",
		cardType: 14,
		name: "Suerte",
	},
	has_potato_launcher: {
		icon: "💣",
		title: "Permite usar el ataque básico más de una vez a 1 de distancia.",
		cardType: 14,
		name: "Lanzapatatas 3000",
	},
};

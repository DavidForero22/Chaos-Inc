export const PERKS_DICTIONARY: Record<
	string,
	{ icon: string; title: string; cardType: number; name: string; lore: string }
> = {
	has_shield: {
		icon: "🛡️",
		title: "El siguiente ataque será bloqueado",
		cardType: 5,
		name: "Escudo",
		lore: "¡Escudo para siempre, me rebota todo!"
	},
	has_distance: {
		icon: "💻",
		title: "Los demás te ven a +1 de alcance",
		cardType: 11,
		name: "Teletrabajo",
		lore: 'Llevas 3 horas jugando y el único "trabajo" que has hecho es avisar por el chat de la empresa que estás en linea.',
	},
	has_storage: {
		icon: "🎒",
		title: "Límite de cartas en mano +1",
		cardType: 13,
		name: "Riñonera",
		lore: "¡Mirad que pedazo riñonera me he traido! Son las bragas de mi mujer.",
	},
	has_luck: {
		icon: "🍀",
		title: "50% de tomar una carta extra al inicio del turno.",
		cardType: 14,
		name: "Suerte",
		lore: "Es la 10º rifa de la oficina que has ganado este año",
	},
	has_potato_launcher: {
		icon: "💣",
		title: "Permite usar el ataque básico más de una vez a 1 de distancia.",
		cardType: 14,
		name: "Lanzapatatas 3000",
		lore: "Monos entrenados en Gibraltar con un solo propósito: robar. Libéralos y contempla el arte del carterismo en su máximo esplendor.",
	},
};

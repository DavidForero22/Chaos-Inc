// src/data/achievements.ts

export interface Achievement {
	id: string;
	title: string;
	technicalDescription: string;
	lore: string;
	image: string;
	rotation?: number;
}

export const ACHIEVEMENTS: Achievement[] = [
	{
		id: "ach_win_intern",
		title: "Apropiación de Empresa",
		technicalDescription: "Gana una partida siendo Becario.",
		lore: "Ya no tendrás que revisar cada dia si te han puesto pegamento ultra fuerte en tu taza de café.",
		image: "/achievements/ach_1_sketch.png",
		rotation: -2,
	},
	{
		id: "ach_win_secretary",
		title: "Lamebotas Profesional",
		technicalDescription: "Gana una partida siendo Secretario.",
		lore: "Ser la mascota del profesor no te hacía mejor estudiante en la escuela, que lo sepas.",
		image: "/achievements/ach_2_sketch.png",
		rotation: 1,
	},
	{
		id: "ach_win_boss",
		title: "Jefazo del Año",
		technicalDescription: "Gana una partida siendo Jefe.",
		lore: "¿Evasión de impuestos, jornadas de 14 horas, maltrato laboral? No pienso hablar sin mi abogado.",
		image: "/achievements/ach_3_sketch.png",
		rotation: -1.5,
	},
	{
		id: "ach_win_unionist",
		title: "Abajo con el Trabajo",
		technicalDescription: "Gana una partida siendo Sindicalista.",
		lore: "Casualmente a nadie le parecia buena idea hacer una huelga japonesa. Se nota la cultura española...",
		image: "/achievements/ach_placeholder.png",
		rotation: 2.5,
	},
	{
		id: "ach_last_unionist",
		title: "Solo ante el Peligro",
		technicalDescription:
			"Gana siendo el último Sindicalista vivo en una partida de 6 jugadores.",
		lore: "Tus compañeros renunciaron en la batalla por el convenio, pero tú te quedaste hasta el final como un héroe.",
		image: "/achievements/ach_5_sketch.png",
		rotation: -3,
	},
	{
		id: "ach_inherited_boss",
		title: "Heredero del Poder",
		technicalDescription:
			"Gana una partida habiendo sido ascendido a Jefe Heredado.",
		lore: "Finalmente podrás enchufar a tus primos en la empresa, la tía Juana ya estaba empezando a insistir demasiado.",
		image: "/achievements/ach_6_sketch.png",
		rotation: 1.2,
	},
	{
		id: "ach_no_passives",
		title: "Sin Bolsillos",
		technicalDescription:
			"Gana una partida sin haber equipado ninguna habilidad pasiva.",
		lore: "Las pasivas están sobrevaloradas, no necesitas mas que habilidad y mentalidad de tiburon.",
		image: "/achievements/ach_placeholder.png",
		rotation: -0.5,
	},
	{
		id: "ach_triple_kill",
		title: "Cazador Fiscal",
		technicalDescription: "Elimina a 3 jugadores en una misma partida.",
		lore: "Los abogados y empleados de Hacienda te miran con temor.",
		image: "/achievements/ach_placeholder.png",
		rotation: 2,
	},
	{
		id: "ach_failed_mass_attack",
		title: "Desgraciado Mal-pagado",
		technicalDescription:
			"Lanza un ataque masivo en una partida de 6 personas y que todos lo esquiven o bloqueen.",
		lore: "La verdad... No se qué decirte, tienes una suerte horrible.",
		image: "/achievements/ach_placeholder.png",
		rotation: -2.8,
	},
	{
		id: "ach_play_10",
		title: "Empleado en Prácticas",
		technicalDescription: "Juega 10 partidas.",
		lore: "Parece que le estás cogiendo el gusto a esta empresa.",
		image: "/achievements/ach_placeholder.png",
		rotation: 1.8,
	},
	{
		id: "ach_play_25",
		title: "Empleado Indefinido",
		technicalDescription: "Juega 25 partidas.",
		lore: "Ya te has aprendido de memoria las plantas en las que el baño está averiado.",
		image: "/achievements/ach_placeholder.png",
		rotation: -1.2,
	},
	{
		id: "ach_gitana_luck",
		title: "Suerte del Principiante",
		technicalDescription:
			"Roba una tercera carta con la pasiva 'Buenaventura Gitana' 4 rondas seguidas.",
		lore: "Los astros se han alineado y en vez de tocarte la lotería, te ha tocado un logro en un juego web. ¡No te pongas triste!",
		image: "/achievements/ach_placeholder.png",
		rotation: 3,
	},
	{
		id: "ach_no_defense",
		title: "Pecho de Hierro",
		technicalDescription:
			"Gana una partida sin haber esquivado o bloqueado ningún ataque.",
		lore: "Despues de tantos años en el gimnasio, que te lancen un microondas ya ni te afecta.",
		image: "/achievements/ach_placeholder.png",
		rotation: -2.2,
	},
	{
		id: "ach_one_hp_clutch",
		title: "Invencible",
		technicalDescription:
			"Gana una partida habiendo quedado con 1 solo punto de vida.",
		lore: "Tienes el ojo del tigre o simplemente mucha suerte.",
		image: "/achievements/ach_placeholder.png",
		rotation: 0.8,
	},
];

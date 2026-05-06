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
		title: "Becario del Mes",
		technicalDescription: "Gana una partida siendo Becario.",
		lore: "Has sobrevivido a los cafés, a las fotocopiadoras y al desprecio general. El primer escalón de la pirámide es el más resbaladizo.",
		image: "achievement_placeholder.png",
		rotation: -2,
	},
	{
		id: "ach_win_secretary",
		title: "Mano Derecha",
		technicalDescription: "Gana una partida siendo Secretario.",
		lore: "Detrás de cada gran desastre corporativo, hay un secretario que organizó la agenda para que ocurriera.",
		image: "achievement_placeholder.png",
		rotation: 1,
	},
	{
		id: "ach_win_boss",
		title: "Techo de Cristal",
		technicalDescription: "Gana una partida siendo Jefe.",
		lore: "Mirar hacia abajo es más fácil cuando tienes un sillón de cuero y el control de las nóminas.",
		image: "achievement_placeholder.png",
		rotation: -1.5,
	},
	{
		id: "ach_win_unionist",
		title: "Derechos Laborales",
		technicalDescription: "Gana una partida siendo Sindicalista.",
		lore: "La huelga ha sido un éxito. Bueno, la huelga y el haber eliminado a la junta directiva.",
		image: "achievement_placeholder.png",
		rotation: 2.5,
	},
	{
		id: "ach_last_unionist",
		title: "Resistencia Obrera",
		technicalDescription:
			"Gana siendo el último Sindicalista vivo en una partida de 6 jugadores.",
		lore: "Tus compañeros cayeron en la batalla por el convenio, pero tú te quedaste para firmar el acta final.",
		image: "achievement_placeholder.png",
		rotation: -3,
	},
	{
		id: "ach_inherited_boss",
		title: "Nepotismo Ilustrado",
		technicalDescription:
			"Gana una partida habiendo sido ascendido a Jefe Heredado.",
		lore: "No naciste con el cargo, pero la vacante era demasiado tentadora (y sangrienta) como para dejarla pasar.",
		image: "achievement_placeholder.png",
		rotation: 1.2,
	},
	{
		id: "ach_no_passives",
		title: "Viernes Casual",
		technicalDescription:
			"Gana una partida sin haber equipado ninguna habilidad pasiva.",
		lore: "Sin planes, sin estrategia, solo tú y tu capacidad de improvisar ante el caos. Como un lunes cualquiera.",
		image: "achievement_placeholder.png",
		rotation: -0.5,
	},
	{
		id: "ach_triple_kill",
		title: "Recorte de Plantilla",
		technicalDescription: "Elimina a 3 jugadores en una misma partida.",
		lore: "Has optimizado los recursos humanos de la forma más definitiva posible. RRHH está impresionado.",
		image: "achievement_placeholder.png",
		rotation: 2,
	},
	{
		id: "ach_failed_mass_attack",
		title: "Error de Outlook",
		technicalDescription:
			"Lanza un ataque masivo en una partida de 6 personas y que todos lo esquiven o bloqueen.",
		lore: "Ese correo con copia a todos que terminó en la carpeta de spam. Un silencio incómodo inunda la oficina.",
		image: "achievement_placeholder.png",
		rotation: -2.8,
	},
	{
		id: "ach_play_10",
		title: "Contrato de Prácticas",
		technicalDescription: "Juega 10 partidas.",
		lore: "Parece que le estás cogiendo el gusto a esto de ser explotado. Ya no eres un extraño en el ascensor.",
		image: "achievement_placeholder.png",
		rotation: 1.8,
	},
	{
		id: "ach_play_25",
		title: "Contrato Indefinido",
		technicalDescription: "Juega 25 partidas.",
		lore: "Ya formas parte del mobiliario. Tu alma pertenece a Chaos Inc. y tus vacaciones están sujetas a aprobación (denegada).",
		image: "achievement_placeholder.png",
		rotation: -1.2,
	},
	{
		id: "ach_gitana_luck",
		title: "Consultoría Esotérica",
		technicalDescription:
			"Roba una tercera carta con la pasiva 'Buenaventura Gitana' 4 rondas seguidas.",
		lore: "Los astros se han alineado o has hackeado el sistema de reparto de tareas. No hagas preguntas.",
		image: "achievement_placeholder.png",
		rotation: 3,
	},
	{
		id: "ach_no_defense",
		title: "Sin Miedo al Despido",
		technicalDescription:
			"Gana una partida sin haber esquivado o bloqueado ningún ataque.",
		lore: "Recibiste los golpes de frente y aun así terminaste el informe a tiempo. Eres una roca corporativa.",
		image: "achievement_placeholder.png",
		rotation: -2.2,
	},
	{
		id: "ach_one_hp_clutch",
		title: "Café de Supervivencia",
		technicalDescription:
			"Gana una partida habiendo quedado con 1 solo punto de vida.",
		lore: "Estás a un estornudo de la baja laboral, pero la victoria sabe mejor cuando la saboreas al borde del abismo.",
		image: "achievement_placeholder.png",
		rotation: 0.8,
	},
];

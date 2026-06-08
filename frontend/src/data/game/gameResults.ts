// src/config/gameResults.ts

import type { PlayerRole } from "../../types/live-game";

export type WinnerRole = "boss" | "union" | "intern" | "canceled" | null;
export type ConfigKey = "boss" | "union" | "intern" | "canceled";

export const RESULT_CONFIG: Record<
	ConfigKey,
	{
		name: string;
		unlockHint: string;
		headline: string;
		image: string;
		subtitle: string;
		description: string;
		winners: PlayerRole[];
	}
> = {
	boss: {
		name: "Victoria del Jefe",
		unlockHint:
			"Termina una partida en la que gane la empresa (Jefe o Secretario)",
		headline: "¡EMPRESA APESTOSA EN CABEZA!",
		image: "/game-result/game_result_boss.jpg",
		subtitle:
			"Chaos Inc. devora al resto de empresas, y su CEO, Oswaldo Calzas, devora un bocata de lomo.",
		description: `Tras las huelgas sindicales motivadas por ciertas 'irregularidades' en la praxis laboral, la firma alcanzó un acuerdo histórico, destinando una gran suma 
        de dinero a su capital humano. Con el objetivo de sanear sus arcas tras el inmenso pago, la dirección reubicó estratégicamente a su plantilla en puestos de venta de 
        limonada y lavado de coches. En apenas siete horas, la organización ha logrado triplicar su patrimonio neto, consolidándose como el hito comercial más exitoso en la 
        historia de Guarromán, Jaén.`,
		winners: ["boss", "secretary"],
	},
	union: {
		name: "Victoria del Sindicato",
		unlockHint: "Termina una partida en la que gane el Sindicato",
		headline: "¡CHAOS INC. CIERRA SUS PUERTAS!",
		image: "/game-result/game_result_union.jpg",
		subtitle:
			"El abandonado establecimiento fue comprado por una cadena de kebabs.",
		description: `Tras meses de huelgas y recogida de firmas por abusos laborales, el sindicato de trabajadores ha logrado que Chaos Inc. se declare en bancarrota y 
		cierre sus puertas para siempre. Al ver que las protestas convencionales no surtían efecto, el comité ejecutó una maniobra desesperada: lanzar huevos contra las 
		oficinas. El problema real no fueron las fachadas vandalizadas, sino que, por un descuido, las gallinas ponedoras escaparon de su corral e irrumpieron en el 
		edificio con sed de venganza materna. En la brutal batalla campal entre oficinistas y aves, el 94% de la plantilla terminó hospitalizada, 
		obligando al cese inmediato de las operaciones de la empresa.`,
		winners: ["union"],
	},
	intern: {
		name: "Victoria de la Becaria",
		unlockHint: "Termina una partida en la que gane la Becaria",
		headline: "¡BECARIA CUALQUIERA SE ADUEÑA UNA EMPRESA!",
		image: "/game-result/game_result_intern.jpg",
		subtitle:
			'"¡Pues ahora pienso montar mi propia empresa, con casinos y f*rcias! Es más, paso de la empresa."',
		description: `En medio de las disputas entre la directiva de Chaos Inc. y el sindicato, una joven que se incorporó hace apenas unas semanas como becaria 
		ha aprovechado el vacío de poder para inscribir su nombre en las escrituras notariales y proclamarse CEO legítima. Según filtraciones internas, sus primeras 
		medidas urgentes han sido reorientar la actividad comercial —pasando de la consultoría  a la fabricación de sartenes para zurdos— y autorizar el libre acceso
		de los becarios a los baños. Mientras tanto, antiguos empleados aseguran haber avistado a Oswaldo Calzas y Gusi 
		Baboncia, ex-altos cargos de la empresa, subsistiendo a base de hacer malabares en los semáforos de la provincia de Jaén.`,
		winners: ["intern"],
	},
	canceled: {
		name: "Partida Cancelada",
		unlockHint: "Quedate en una partida que se cancele por falta de jugadores.",
		headline: "¡NUNCA PASA NADA!",
		image: "/game-result/game_result_cancelled.jpg",
		subtitle: "También en la sección del tiempo: Nublado",
		description: `Tras meses de hostilidades, la directiva de Chaos Inc. y el sindicato han firmado un armisticio por puro agotamiento. La empresa retomará su actividad 
        habitual mientras el sindicato ya busca una nueva organización a la que asediar hasta el cierre. Para calmar los ánimos, los huelguistas han sido debidamente 
		compensados con una porción de pizza y un refresco. En otro orden de cosas, se informa de que el departamento de limpieza explotó repentinamente durante el 
		conflicto, resultando en el fallecimiento del operario de turno. Su familia ha sido debidamente compensada con una porción de pizza y un refresco.`,
		winners: [],
	},
};

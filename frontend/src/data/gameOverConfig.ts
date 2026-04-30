export type WinnerRole = "boss" | "union" | "intern" | "canceled" | null;
export type PlayerRole = "boss" | "secretary" | "intern" | "union";
export type ConfigKey = "boss" | "union" | "intern" | "canceled";

export const RESULT_CONFIG: Record<
	ConfigKey,
	{
		headline: string;
		image: string;
		subtitle: string;
		description: string;
		winners: PlayerRole[];
	}
> = {
	boss: {
		headline: "¡EMPRESA APESTOSA EN CABEZA!",
		image: "/placeholder_news_boss.jpg",
		subtitle:
			"Chaos Inc. devora al resto de empresas, y su CEO, Oswaldo Calzas, devora un bocata de lomo.",
		description: `Tras las huelgas sindicales motivadas por ciertas 'irregularidades' en la praxis laboral, la firma alcanzó un acuerdo histórico, destinando una gran suma 
        de dinero a su capital humano. Con el objetivo de sanear sus arcas tras el inmenso pago, la dirección reubicó estratégicamente a su plantilla en puestos de venta de 
        limonada y lavado de coches. En apenas siete horas, la organización ha logrado triplicar su patrimonio neto, consolidándose como el hito comercial más exitoso en la 
        historia de Guarromán, Murcia.`,
		winners: ["boss", "secretary"],
	},
	union: {
		headline: "¡CHAOS INC. CIERRA SUS PUERTAS!",
		image: "/placeholder_news_union.jpg",
		subtitle:
			"El abandonado establecimiento fue comprado por una cadena de Labubus.",
		description: `Tras meses de huelgas y recogida de firmas por abusos laborales, el sindicato de trabajadores ha logrado que Chaos Inc. se declare en bancarrota y cierre 
            sus puertas para siempre. Al ver que las protestas convencionales no surtían efecto, el comité ejecutó una maniobra sin precedentes: organizar turnos para que las 
            mascotas de todos los huelguistas orinasen frente a la sede principal a diario. El insoportable hedor acabó provocando el abandono masivo de las instalaciones, dejando 
            a la directiva sin más opción que la rendición.`,
		winners: ["union"],
	},
	intern: {
		headline: "¡RUBIA CUALQUIERA SE ADUEÑA UNA EMPRESA!",
		image: "/placeholder_news_intern.jpg",
		subtitle:
			"¡Pues ahora pienso montar mi propia empresa, con casinos y furcias! Es más, paso de la empresa.",
		description: `En mitad de las encarnizadas disputas entre la directiva de Chaos Inc. y el sindicato de trabajadores, una joven que se incorporó hace apenas semanas como becaria ha 
            aprovechado el vacío de poder para autoproclamarse CEO. La incógnita sobre cómo logró inscribir su nombre en las escrituras de la empresa entre grito y grito sigue
            desconcertando a los analistas. Mientras tanto, antiguos empleados aseguran haber visto a Oswaldo Calzas y Gusi Baboncia, ex-directivos de la empresa, pidiendo limosna 
            y haciendo malabares en los semáforos de las carreteras de Murcia.`,
		winners: ["intern"],
	},
	canceled: {
		headline: "¡NUNCA PASA NADA!",
		image: "/placeholder_news_canceled.jpg",
		subtitle: "",
		description: `Tras meses de hostilidades, la directiva de Chaos Inc. y el sindicato han firmado un armisticio por puro agotamiento. La empresa retomará su actividad 
        habitual mientras los sindicalistas ya buscan una nueva organización a la que asediar hasta el cierre. Para calmar los ánimos, los huelguistas han sido obsequiados 
        con una porción de pizza y un refresco. En otro orden de cosas, se informa de que el departamento de limpieza explotó repentinamente durante el conflicto, resultando 
        en el fallecimiento del operario de turno. Su familia ha sido debidamente compensada con una porción de pizza y un refresco.`,
		winners: [],
	},
};

export const ROLE_LABELS: Record<PlayerRole, string> = {
	boss: "Jefe",
	secretary: "Secretariado",
	intern: "Becario",
	union: "Sindicalista",
};

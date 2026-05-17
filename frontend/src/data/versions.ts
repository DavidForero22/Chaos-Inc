export interface VersionRecord {
	id: number;
	version: string;
	date: string;
	description: string;
	notes: string[];
	changes: string[];
}

export const CHANGELOG_DATA: VersionRecord[] = [
	{
		id: 5,
		version: "0.5.0",
		date: "17-05-2026",
		description: "Accesibilidad y últimas ilustraciones.",
		notes: [
			"Esta semana no he tocado tanto el proyecto, por eso no hay tantos cambios en esta versión. Venía un poco quemado de tanto picar código, así que gran parte del tiempo me lo pasé dibujando. La verdad es que estar a las 2 de la madrugada dibujando con Los Delinqüentes en Spotify es peak.",
			"Por algún motivo no había pensado antes lo útil que me vendría un menú de depuración para equiparme cartas, manipular las victorias... Todas las pruebas las estaba haciendo a mano; no me he sentido más imbécil en mi vida. Al implementar este nuevo menú se me fue la pinza con las funciones que tendría y al final acabé creando un monstruo que no sabía ni cómo gestionar, así que tuve que simplificarlo bastante. Recordad, chavales: menos es más. Consejito de David.",
			"Quería meter los niveles de los jugadores y las cartas legendarias en esta versión, pero recientemente he empezado a jugar al Ball x Pit y, bueno, me ha dado pereza la verdad, estoy un poco viciado XD.",
			"También tuvimos que censurar cierto detalle en la ilustración del rol del jefe... Si algún día este juego se hace famoso (lo dudo), esto será tema para un iceberg de internet.",
		],
		changes: [
			"Agregado registro de versiones en 'Saber más'.",
			"Agregada ilustración de rol de jugador (Progreso: 4/4).",
			"Agregadas ilustraciones para las cartas.",
			"Agregadas pantallas de fin de juego (Progreso: 4/4).",
			"Agregado mensaje de muerte.",
			"Agregado un menú de depuración para admins.",
			"Modificados los jugadores muertos para que sean más legibles.",
			"Mejoras de accesibilidad.",
			"Corrección de errores.",
		],
	},
	{
		id: 4,
		version: "0.4.0",
		date: "10-05-2026",
		description: "Perfiles y logros.",
		notes: [
			"Esta versión se centró principalmente en mejorar los perfiles, los cuales eran el punto más flojo que tenía la web. En cambio ahora, es un apartado mucho más complejo (avatares, redes sociales conectadas, logros, gráficos, visualización de otros perfiles...). Soy un poco friki con el tema de logros y estadísticas, asi que no pude resitir la tentación de incluirlo en el proyecto.",
			"Intenté mejorar la seguridad de los datos de las partidas porque, hasta ahora, estaba usando los nombres de usuario como claves para guardar los datos, lo cual era un riesgo alto que no había visto antes, ya que los nombres pueden ser cambiados durante las partidas. Al intentar cambiar estas claves por los IDs de jugadores, rompí toda la lógica del servidor y estuve dos días enteros corrigiendo la pifia que había hecho. Primero me lo cargo con Discord/Google y ahora con esto... vaya patoso que soy, macho.",
			"A medida que la fecha de entrega del proyecto se acercaba, dudaba de si debería descartar el chat de la partida o intentar sacar tiempo para implementarlo. Lo que sí me gustaría agregar es un sistema de niveles y cartas legendarias, espero que me de tiempo.",
		],
		changes: [
			"Agregados 6 logros.",
			"Agregados gráficos a los perfiles con nuevas estadísticas.",
			"Agregadas páginas de errores.",
			"Agregada navegación de perfiles.",
			"Agregada sincronización con Discord y Google.",
			"Agregada edición de perfil.",
			"Agregados avatares de perfil.",
			"Página de perfiles renovada con un nuevo estilo.",
			"Historial de partidas mejorado.",
			"Mejoras de usabilidad.",
			"Mejoras de seguridad.",
			"Corrección de errores.",
		],
	},
	{
		id: 3,
		version: "0.3.0",
		date: "04-05-2026",
		description: "Tematización y mejoras de interfaz y jugabilidad.",
		notes: [
			"Con la web finalizada y el servidor optimizado, pude avanzar en las funcionalidades que realmente quería desarrollar.",
			"Mientras corregía errores, anotaba constantemente fallos o ideas que se me ocurrían para implementarlas más adelante.",
			"Junto con unos amigos, tematizamos todas las cartas durante una llamada. Queríamos que el 'lore' de las cartas estuviese formado por referencias, chistes, dobles sentidos, etc. Fue más complicado de lo que pensaba en verdad; no queríamos que pareciesen frases sacadas de un post de LinkedIn.",
			"Al intentar implementar el inicio de sesión con Google y Discord, me cargué el servidor por accidente; me llevó casi 4 horas reparar el desastre que había hecho (y eso que ni siquiera funcionaba, fue en la siguiente versión donde logré que se conectase...).",
			"Lo más divertido de esta versión con diferencia fue realizar la imagen de fin de juego. Espero no llevarme una denuncia de derechos de autor por usar un póster de Mortadelo y Filemón de base (?.",
		],
		changes: [
			"Agregado botón para salir de la sala.",
			"Agregada pantalla de fin de juego (Progreso: 1/4).",
			"Agregada ilustración de rol de jugador (Progreso: 3/4).",
			"Agregados notificaciones de acciones durante la partida.",
			"Agregado modo 'Info' para pantallas pequeñas.",
			"Cartas y pantallas de fin de juego tematizadas.",
			"Interfaz optimizada para dispositivos móviles y tablets.",
			"Descartadas variantes de cartas.",
			"Correcciones de errores en el cliente y en el servidor.",
		],
	},
	{
		id: 2,
		version: "0.2.0",
		date: "29-04-2026",
		description: "Rediseño de la web y optimizaciones.",
		notes: [
			"Tras terminar la parte más difícil del desarrollo, comencé a preparar el diseño final del sitio web y su versión móvil. Tuve una crisis artística al no saber cómo tematizar el sitio web, hasta que a base de dibujar bocetos en Paint comencé a hacerme una idea de qué quería realmente.",
			"En un principio, las páginas principales iban a tener de cuerpo una carpeta de pinza y el fondo sería una pared; de hecho, saqué una foto de la pared de mi propia habitación. No me terminó de convencer, hasta que se me ocurrió que el cuerpo fuese una libreta, los enlaces fuesen marcapáginas y el fondo una mesa de madera.",
			"Mientras revisaba el código, me di cuenta de graves errores de optimización que había cometido en la versión anterior. En un cambio brusco de planes, empecé a trabajar intensamente en la optimización del servidor. El tiempo invertido no fue en vano, ya que los resultados finales fueron muy notables.",
			"El amigo al que encargué las ilustraciones para los roles de la partida me presentó las dos primeras imágenes. Me gustaron tanto que decidí que en un futuro crearía ilustraciones de fin de partida basándome en sus diseños. Cuando acabe el proyecto tendré que regalarle un juego o algo porque se lo merece.",
		],
		changes: [
			"Agregadas variantes de cartas para mayor diversidad.",
			"Agregada guía de iconos de cartas en la interfaz.",
			"Agregadas ilustraciones de roles de jugador (Progreso: 2/4).",
			"Rediseño total del sitio web con soporte para móviles.",
			"Mejoras en la experiencia de juego e interfaz de usuario.",
			"Optimización considerable del rendimiento en cliente y servidor.",
			"Refuerzo de la seguridad en sesiones de usuario y llamadas del servidor.",
		],
	},
	{
		id: 1,
		version: "0.1.0",
		date: "07-04-2026",
		description: "Base del juego completada y funcional.",
		notes: [
			"Antes de siquiera llegar a pensar en esta idea para mi proyecto de fin de curso, barajé otras opciones como una aplicación informativa de ejercicios, una aplicación informativa de paleontología, una aplicación informativa de astronomía... No sé qué me dio con las páginas informativas en ese entonces. El caso es que un día, hablando con un amigo, le estaba comentando sobre un juego de mesa (BANG!) que jugábamos en los descansos de clase que me gustaba bastante y, en algún punto, llegamos a acabar hablando de lo guay que estaría hacer mi propia versión de ese juego. Al pensarlo dos veces, me di cuenta de la tremenda idea que habíamos sacado con la tontería. ",
			"Empecé a desarrollar la documentación del proyecto a mediados de enero. Hasta febrero estuve investigando qué tecnologías usar y cómo estructurar las bases de datos. Quería tener las bases del proyecto bien planteadas para que, al desarrollarlo, tuviera más claro qué debo hacer.",
			"Esta primera versión fue con diferencia la que más tiempo del desarrollo total se llevó. Principalmente fue el sistema de desconexión lo que más guerra me dio. El hecho de diseñar el flujo de desconexión y reconexión en una partida ya fue complicado de entender, pero adaptarlo a código ha sido una batalla con la que tengo pesadillas todavía. No sería hasta la versión 0.3 que logré tener un sistema de desconexiones realmente eficaz.",
		],
		changes: [
			"Desarrollo del motor de juego base con las primeras 15 cartas.",
			"Implementado sistema de reconexión y gestión de sesiones para invitados.",
			"Agregado modo de gestión de datos para administradores.",
			"Agregado sistema de historial y estadísticas básicas de jugadores.",
		],
	},
];

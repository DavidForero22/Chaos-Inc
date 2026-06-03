// src/config/roles.ts

import type { MyData } from "../../types/live-game.ts";

export type DisplayRole = MyData["role"];
export type DisplayableRole = Exclude<DisplayRole, "hidden">;

/**
 * Traduccion de las claves de los roles
 */
export const ROLE_LABELS: Record<DisplayableRole, string> = {
	boss: "Jefe",
	secretary: "Secretariado",
	intern: "Becaria",
	union: "Sindicato",
};

export const ROLE_CONFIG: Record<
	DisplayableRole,
	{
		label: string;
		color: string;
		image: string;
		objective: string;
		titleLabel: string;
		unlockHint: string;
	}
> = {
	boss: {
		label: "Jefe",
		color: "text-yellow-400",
		image: "/roles/role_reveal_boss.jpeg",
		objective:
			"Meses de explotación y maltrato laboral han cultivado sus frutos: tienes al sindicato de trabajadores pidiendo tu cabeza en bandeja. Acaba con el sindicato y evita que la becaria sea la última en pie. La becaria podría fingir ser tu secretario para traicionarte.",
		titleLabel: "Tu rol: Jefe",
		unlockHint: "Comienza una partida jugando como Jefe",
	},
	secretary: {
		label: "Secretario",
		color: "text-blue-400",
		image: "/roles/role_reveal_secretary.jpeg",
		objective:
			"Eres la mano derecha de la dirección. El sindicato busca acabar con el jefe y la becaria quiere ser la última en pie; debes evitar ambas situaciones. Si cae el jefe, tú también caes. La becaria intentará hacerse pasar por tu rol, ten cuidado.",
		titleLabel: "Tu rol: Secretario",
		unlockHint: "Comienza una partida jugando como Secretario",
	},
	intern: {
		label: "Becaria",
		color: "text-green-400",
		image: "/roles/role_reveal_intern.jpeg",
		objective:
			"Has decidido adueñarte de la empresa por la fuerza para dejar de cobrar menos del salario mínimo. Para ello, tendrás que ser el último jugador en pie. Acaba con el sindicato y finge ser el secretario para ganarte la confianza del jefe.",
		titleLabel: "Tu rol: Becaria",
		unlockHint: "Comienza una partida jugando como Becaria",
	},
	union: {
		label: "Sindicato",
		color: "text-red-400",
		image: "/roles/role_reveal_union.jpeg",
		objective:
			"El sistema está corrupto y tú eres la cura. Coordina con tus compañeros para acabar con el jefe y su horripilante empresa. El secretario y la becaria intentarán pararos los pies, no tengáis piedad.",
		titleLabel: "Tu rol: Sindicato",
		unlockHint: "Comienza una partida jugando como Sindicato",
	},
};

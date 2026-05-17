import type { MyData } from "../types/live-game.ts";

export type DisplayRole = MyData["role"];

/**
 * Traduccion de las claves de los roles
 */
export const ROLE_LABELS: Record<DisplayRole, string> = {
	boss: "Jefe",
	secretary: "Secretariado",
	intern: "Becaria",
	union: "Sindicato",
};

export const ROLE_CONFIG: Record<
	DisplayRole,
	{
		label: string;
		image: string;
		objective: string;
		titleLabel: string;
	}
> = {
	boss: {
		label: "Jefe",
		image: "/roles/role_reveal_boss.jpeg",
		objective:
			"Meses de explotación y maltrato laboral han cultivado sus frutos: tienes al sindicato de trabajadores pidiendo tu cabeza en bandeja. Acaba con el sindicato y evita que la becaria sea la última en pie. La becaria podría fingir ser tu secretario para traicionarte.",
		titleLabel: "Tu rol: Jefe",
	},
	secretary: {
		label: "Secretario",
		image: "/roles/role_reveal_secretary.jpeg",
		objective:
			"Eres la mano derecha de la dirección. El sindicato busca acabar con el jefe y la becaria quiere ser la última en pie; debes evitar ambas situaciones. Si cae el jefe, tú también caes. La becaria intentará hacerse pasar por tu rol, ten cuidado.",
		titleLabel: "Tu rol: Secretario",
	},
	intern: {
		label: "Becaria",
		image: "/roles/role_reveal_intern.jpeg",
		objective:
			"Has decidido adueñarte de la empresa por la fuerza para dejar de cobrar menos del salario mínimo. Para ello, tendrás que ser el último jugador en pie. Acaba con el sindicato y finge ser el secretario para ganarte la confianza del jefe.",
		titleLabel: "Tu rol: Becaria",
	},
	union: {
		label: "Sindicato",
		image: "/roles/role_reveal_union.jpeg",
		objective:
			"El sistema está corrupto y tú eres la cura. Coordina con tus compañeros para acabar con el jefe y su horripilante empresa. El secretario y la becaria intentarán pararos los pies, no tengáis piedad.",
		titleLabel: "Tu rol: Sindicato",
	},
};

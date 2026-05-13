import type { MyData } from "../types/live-game.ts";

export type DisplayRole = MyData["role"];

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
			"Eres el jefe de la empresa. Tu prioridad absoluta es mantener el control y despedir a los Sindicalistas encubiertos antes de que organicen un motín que te deje en la calle.",
		titleLabel: "Tu rol en esta partida",
	},
	secretary: {
		label: "Secretario",
		image: "/roles/role_reveal_secretary.jpeg",
		objective:
			"Eres la mano derecha de Dirección. Filtra la información, desvía sospechas y protege el puesto del Jefe por encima de todo. Si la Dirección cae, tú también.",
		titleLabel: "Tu rol en esta partida",
	},
	intern: {
		label: "Becario",
		image: "/roles/role_reveal_intern.jpeg",
		objective:
			"Tu contrato no está remunerado y estás harto. Sobrevive al caos, elimina a la competencia directa y asciende en la cadena alimenticia hasta convertirte en el nuevo Jefe.",
		titleLabel: "Tu rol en esta partida",
	},
	union: {
		label: "Sindicalista",
		image: "/roles/role_reveal_union.jpeg",
		objective:
			"El sistema está corrupto y tú eres la cura. Coordínate en secreto, expón las prácticas ilegales y acaba con la Dirección actual para tomar el control de la empresa.",
		titleLabel: "Tu rol en esta partida",
	}
};

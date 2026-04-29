// src/data/iconGuideData.ts

import type { IconType } from "react-icons";
import { RiSwordFill } from "react-icons/ri";
import { GiHealthNormal } from "react-icons/gi";
import { FaRunning, FaTrash, FaUser, FaUsers } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import { IoHandLeftSharp } from "react-icons/io5";
import { BsBackpack2Fill } from "react-icons/bs";
import { ImTarget } from "react-icons/im";

export interface GuideItem {
	icon: IconType;
	name: string;
	desc: string;
}

export const GUIDE_ITEMS: GuideItem[] = [
	{
		icon: RiSwordFill,
		name: "Atacar",
		desc: "Aumenta el estrés del objetivo.",
	},
	{
		icon: GiHealthNormal,
		name: "Curar",
		desc: "Reduce tu propio estrés.",
	},
	{
		icon: FaRunning,
		name: "Esquivar",
		desc: "Evade el próximo ataque entrante.",
	},
	{
		icon: IoIosLock,
		name: "Bloquear",
		desc: "Impide que un rival juegue cartas.",
	},
	{
		icon: IoHandLeftSharp,
		name: "Robar",
		desc: "Roba una carta de la mano de un rival.",
	},
	{
		icon: FaTrash,
		name: "Descartar",
		desc: "Obliga a tirar cartas o tú las descartas.",
	},
	{
		icon: BsBackpack2Fill,
		name: "Pasiva",
		desc: "Habilidad continua o de un solo uso.",
	},
	{
		icon: FaUser,
		name: "Objetivo: Tú",
		desc: "La carta solo te afecta a ti.",
	},
	{
		icon: ImTarget,
		name: "Objetivo: Rival",
		desc: "Requiere seleccionar a un empleado.",
	},
	{
		icon: FaUsers,
		name: "Objetivo: Todos",
		desc: "Afecta a todos en la oficina.",
	},
];

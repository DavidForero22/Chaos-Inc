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
		desc: "Bloquea el siguiente turno del objetivo.",
	},
	{
		icon: IoHandLeftSharp,
		name: "Robar",
		desc: "Roba una carta de la mano del objetivo.",
	},
	{
		icon: FaTrash,
		name: "Descartar",
		desc: "Obliga a descartar cartas.",
	},
	{
		icon: BsBackpack2Fill,
		name: "Pasiva",
		desc: "Habilidad pasiva.",
	},
	{
		icon: FaUser,
		name: "Objetivo: Tú",
		desc: "La carta solo te afecta a ti.",
	},
	{
		icon: ImTarget,
		name: "Objetivo: Rival",
		desc: "Requiere seleccionar a un objetivo.",
	},
	{
		icon: FaUsers,
		name: "Objetivo: Todos",
		desc: "Afecta a todos en la partida.",
	},
];

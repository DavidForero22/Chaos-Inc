// src/components/game/RoleRevealModal.tsx

import type { MyData } from "../../../types/live-game.ts";
import { Modal } from "../../ui/Modal.tsx";

type DisplayRole = MyData["role"] | "acting_boss";

const ROLE_CONFIG: Record<
	DisplayRole,
	{
		label: string;
		emoji: string;
		color: string;
		objective: string;
		titleLabel: string;
		isWarning?: boolean;
	}
> = {
	boss: {
		label: "Jefe",
		emoji: "👑",
		color: "text-yellow-400",
		objective:
			"Eres el jefe de la empresa. ¡Acaba con los Sindicalistas de trabajadores antes de que te echen de la empresa!",
		titleLabel: "Tu rol en esta partida",
	},
	secretary: {
		label: "Secretario",
		emoji: "📋",
		color: "text-blue-400",
		objective:
			"Eres el secretario del jefe. ¡Protege su puesto por lo que más sea, no puede caer!",
		titleLabel: "Tu rol en esta partida",
	},
	intern: {
		label: "Becario",
		emoji: "🎓",
		color: "text-green-400",
		objective:
			"Eres el becario. ¡Acaba con todos en la empresa y conviértete en el nuevo jefe!",
		titleLabel: "Tu rol en esta partida",
	},
	union: {
		label: "Sindicalista",
		emoji: "✊",
		color: "text-red-400",
		objective:
			"Eres sindicalista. ¡Acaba con el jefe de esta empresa corrupta!",
		titleLabel: "Tu rol en esta partida",
	},
	acting_boss: {
		label: "Eres el nuevo Jefe",
		emoji: "👑",
		color: "text-yellow-400",
		objective:
			"El jefe se ha desconectado y has heredado su cargo en secreto. Ahora debes sobrevivir y eliminar a los Sindicalistas. Si se reconecta el jefe original, recuperarás tu puesto anterior.",
		titleLabel: "⚠️ Cambio de poder",
		isWarning: true,
	},
};

interface RoleRevealModalProps {
	role: MyData["role"];
	onClose: () => void;
	isActingBoss?: boolean;
}

export function RoleRevealModal({
	role,
	onClose,
	isActingBoss = false,
}: RoleRevealModalProps) {
	const displayKey: DisplayRole = isActingBoss ? "acting_boss" : role;
	const config = ROLE_CONFIG[displayKey];

	return (
		<Modal>
			<p
				className={`text-xs uppercase font-bold tracking-widest mb-4 ${
					config.isWarning ? "text-yellow-400" : "text-gray-400"
				}`}
			>
				{config.titleLabel}
			</p>

			<div className="text-6xl mb-4">{config.emoji}</div>
			<h2 className={`text-3xl font-black mb-2 ${config.color}`}>
				{config.label}
			</h2>

			<div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mt-4 mb-6">
				<p className="text-xs text-gray-500 uppercase font-bold mb-2">
					{config.isWarning ? "Tu nueva misión" : "Tu objetivo"}
				</p>
				<p className="text-gray-300 text-sm leading-relaxed">
					{config.objective}
				</p>
			</div>

			<button
				onClick={onClose}
				className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
			>
				¡Entendido!
			</button>
		</Modal>
	);
}

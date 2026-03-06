import type { MyData } from "../../types/types.ts";

const ROLE_CONFIG: Record<
	MyData["role"],
	{ label: string; emoji: string; color: string; objective: string }
> = {
	boss: {
		label: "Jefe",
		emoji: "👑",
		color: "text-yellow-400",
		objective: "Eres el jefe de la empresa. ¡Acaba con los Sindicalistas de trabajadores antes de que te hechen de la empresa!",
	},
	secretary: {
		label: "Secretario",
		emoji: "📋",
		color: "text-blue-400",
		objective: "Eres el secretario del jefe. ¡Protege su puesto por lo que mas sea, no puede caer!",
	},
	intern: {
		label: "Becario",
		emoji: "🎓",
		color: "text-green-400",
		objective: "Eres el becario. ¡Acaba con todos en la empresa y conviertete en el nuevo jefe!",
	},
	union: {
		label: "Sindicalista",
		emoji: "✊",
		color: "text-red-400",
		objective: "Eres sindicalista. ¡Acaba con el jefe de esta empresa corrupta!",
	},
};

interface RoleRevealModalProps {
	role: MyData["role"];
	onClose: () => void;
}

export function RoleRevealModal({ role, onClose }: RoleRevealModalProps) {
	const config = ROLE_CONFIG[role];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
				<p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-4">
					Tu rol en esta partida
				</p>

				<div className="text-6xl mb-4">{config.emoji}</div>

				<h2 className={`text-3xl font-black mb-2 ${config.color}`}>
					{config.label}
				</h2>

				<div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mt-4 mb-6">
					<p className="text-xs text-gray-500 uppercase font-bold mb-2">
						Tu objetivo
					</p>
					<p className="text-gray-300 text-sm leading-relaxed">
						{config.objective}
					</p>
				</div>

				<button
					onClick={onClose}
					className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
				>
					¡Entendido, a jugar!
				</button>
			</div>
		</div>
	);
}

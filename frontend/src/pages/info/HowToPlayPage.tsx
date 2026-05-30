// src/pages/HowToPlayPage.tsx

import BoardLayout from "../../components/how-to-play/BoardGuide";
import CoreMechanics from "../../components/how-to-play/CoreMechanics";
import GameTheme from "../../components/how-to-play/GameTheme";
import RolesAndObjectives from "../../components/how-to-play/RolesAndObjectives";
import TurnFlow from "../../components/how-to-play/TurnFlow";

export default function HowToPlayPage() {
	return (
		<main className="pl-6 space-y-8 pb-10 pr-6">
			<header className="mb-6">
				<h1
					className="text-4xl mb-6 font-black uppercase"
					style={{ color: "var(--color-lomo)" }}
				>
					Cómo Jugar
				</h1>
				<h2 className="text-xl opacity-80 border-b border-gray-400 pb-2 font-bold">
					Manual para Principiantes
				</h2>
			</header>
			<GameTheme />
			<hr className="border-gray-700" />
			<RolesAndObjectives />
			<hr className="border-gray-700" />
			<CoreMechanics />
			<hr className="border-gray-700" />
			<TurnFlow />
			<hr className="border-gray-700" />
			<BoardLayout />
		</main>
	);
}

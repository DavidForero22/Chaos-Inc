// src/pages/errors/GameAlreadyStartedPage.tsx

import ErrorLayout from "../../layouts/ErrorLayout.tsx";

export default function GameAlreadyStartedPage() {
	return (
		<ErrorLayout
			title="Partida en curso (409)"
			description="La partida ya ha comenzado y no se admiten nuevos jugadores."
			subtitle="Quien se fue a Sevilla perdió su silla."
			buttonText="Buscar otra sala"
			returnPath="/rooms"
		/>
	);
}

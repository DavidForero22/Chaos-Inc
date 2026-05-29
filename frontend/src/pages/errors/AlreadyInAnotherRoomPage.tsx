// src/pages/errors/AlreadyInAnotherRoomPage.tsx

import { useLocation } from "react-router-dom";
import ErrorLayout from "../../layouts/ErrorLayout.tsx";

export default function AlreadyInAnotherRoomPage() {
	const location = useLocation();
	const roomId = location.state?.roomId || "desconocida";

	return (
		<ErrorLayout
			title="Ya estás en otra sala"
			description={`Ya te encuentras en otra sala o partida en curso (Sala: ${roomId}).`}
			subtitle="¡Decidete en que sala vas a jugar y deja de hacer tonterias!"
			buttonText="Volver al menú principal"
			returnPath="/"
		/>
	);
}

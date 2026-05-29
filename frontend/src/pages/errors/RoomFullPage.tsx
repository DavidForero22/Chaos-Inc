// src/pages/errors/RoomFullPage.tsx

import ErrorLayout from "../../layouts/ErrorLayout.tsx";

export default function RoomFullPage() {
	return (
		<ErrorLayout
			title="Sala completa (409)"
			description="La sala a la que intentas acceder ha alcanzado su capacidad máxima."
			subtitle="Todas las plazas están ocupadas. Prueba a buscar otra sala o espera a que quede un hueco libre. La paciencia es una virtud, agente."
			buttonText="Buscar otra sala"
			returnPath="/rooms"
		/>
	);
}

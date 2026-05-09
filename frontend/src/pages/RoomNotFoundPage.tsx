import ErrorLayout from "../layouts/ErrorLayout.tsx";

export default function RoomNotFoundPage() {
	return (
		<ErrorLayout
			title="Sala no encontrada (404)"
			description="No se ha podido acceder a la sala solicitada."
			subtitle="Es posible que la partida haya terminado, la sala se haya borrado o que accidentalmente a alguien se le cayera el café en el servidor."
			buttonText="Volver a buscar sala"
			returnPath="/rooms"
		/>
	);
}

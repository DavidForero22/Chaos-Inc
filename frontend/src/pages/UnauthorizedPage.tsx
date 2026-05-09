import ErrorLayout from "../layouts/ErrorLayout.tsx";

export default function UnauthorizedPage() {
	return (
		<ErrorLayout
			title="Acceso Denegado (403)"
			description="No tienes permisos para acceder a esta página."
			subtitle="No te preocupes, aquí solo hay fotos de pingüinos y babuinos, ningún dato que necesites consultar."
			buttonText="Volver al menú principal"
			returnPath="/"
		/>
	);
}

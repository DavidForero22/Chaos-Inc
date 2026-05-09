import ErrorLayout from "../../layouts/ErrorLayout.tsx";

export default function PageNotFoundPage() {
	return (
		<ErrorLayout
			title="Página no encontrada (404)"
			description="No se ha podido acceder a la página solicitada."
			subtitle="Es posible que la página se haya eliminado, no exista o que nuestros servidores hayan volado por los aires."
			buttonText="Volver al inicio"
			returnPath="/"
		/>
	);
}

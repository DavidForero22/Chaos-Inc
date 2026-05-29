// src/pages/errors/UserNotFoundPage.tsx

import ErrorLayout from "../../layouts/ErrorLayout.tsx";

export default function UserNotFoundPage() {
	return (
		<ErrorLayout
			title="Usuario no encontrado (404)"
			description="No se ha podido acceder al perfil solicitado."
			subtitle="Es posible que el perfil haya sido eliminado, el usuario nunca haya existido, o que el casero nos haya cortado la luz."
			buttonText="Volver al menú principal"
			returnPath="/"
		/>
	);
}

import { useSearchParams } from "react-router-dom";
import ErrorLayout from "../layouts/ErrorLayout.tsx";

export default function SocialLinkingErrorPage() {
	const [searchParams] = useSearchParams();
	const error = searchParams.get("error");

	const getErrorMessage = () => {
		switch (error) {
			case "email_taken":
				return "Este correo electrónico ya está registrado en el perfil de otro usuario.";
			case "provider_taken":
				return "Esta credencial de acceso ya está asignada a otro usuario.";
			case "oauth_failed":
				return "El proveedor externo ha rechazado la solicitud. Inténtelo de nuevo.";
			default:
				return "Se ha producido un error inesperado al conectar cuentas.";
		}
	};

	const getErrorCode = () => {
		switch (error) {
			case "email_taken":
				return "AUTH-409";
			case "provider_taken":
				return "AUTH-403";
			case "oauth_failed":
				return "AUTH-502";
			default:
				return "SYS-500";
		}
	};

	return (
		<ErrorLayout
			title={`Fallo de Credenciales (${getErrorCode()})`}
			description={getErrorMessage()}
			subtitle="Quizás la culpa no sea nuestra, no nos mires así."
			buttonText="Volver al Perfil"
			returnPath="/profile"
		/>
	);
}

import { useSearchParams, Link } from "react-router-dom";
import styles from "./SocialLinkingErrorPage.module.css";

export default function SocialLinkingErrorPage() {
	const [searchParams] = useSearchParams();
	const error = searchParams.get("error");

	const getErrorMessage = () => {
		switch (error) {
			case "email_taken":
				return "Este correo electrónico ya está vinculado a otra cuenta corporativa.";
			case "provider_taken":
				return "Esta cuenta social ya está vinculada a otro empleado.";
			case "oauth_failed":
				return "La comunicación con el proveedor ha fallado. Inténtalo de nuevo.";
			default:
				return "Ha ocurrido un error inesperado al intentar vincular tu cuenta.";
		}
	};

	return (
		<div className={styles.wrapper}>
			<h1 className={styles.title}>ERROR</h1>
			<div className={styles.card}>
				<p className={styles.message}>{getErrorMessage()}</p>
				<Link to="/profile" className={styles.button}>
					Volver a la página principal
				</Link>
			</div>
		</div>
	);
}

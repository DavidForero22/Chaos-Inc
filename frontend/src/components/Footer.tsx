import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import styles from "./Footer.module.css";

export default function Footer() {
	return (
		<div className={styles.postItContainer}>
			<div className={styles.postIt}>
				{/* Chincheta o celo simulado (opcional, le da un toque) */}
				<div className={styles.tape}></div>

				<h3 className={styles.title}>Contacto</h3>

				<div className={styles.links}>
					<a
						href="https://www.linkedin.com/in/david-fs/"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Perfil de LinkedIn"
						className={styles.iconLink}
					>
						<FaLinkedin size={28} />
					</a>
					<a
						href="https://github.com/DavidForero22"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Perfil de GitHub"
						className={styles.iconLink}
					>
						<FaGithub size={28} />
					</a>
					<a
						href="mailto:forero.santillana.david@gmail.com"
						aria-label="Enviar correo electrónico"
						className={styles.iconLink}
					>
						<FaEnvelope size={28} />
					</a>
				</div>
			</div>
		</div>
	);
}

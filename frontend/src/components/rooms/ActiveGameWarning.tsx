import { useNavigate } from "react-router-dom";
import styles from "./ActiveGameWarning.module.css";

interface ActiveGameWarningProps {
	roomId: string;
}

export default function ActiveGameWarning({ roomId }: ActiveGameWarningProps) {
	const navigate = useNavigate();

	return (
		<div className={styles.warningContainer}>
			<div className={styles.warningText}>
				<span className={styles.icon}>⚠️</span>
				<div>
					<p className={styles.title}>Sala Activa</p>
					<p className={styles.subtitle}>
						Ya te encuentras dentro de una sala.
					</p>
				</div>
			</div>
			<button
				onClick={() => navigate(`/room/${roomId}`)}
				className={styles.returnBtn}
			>
				Volver a la sala
			</button>
		</div>
	);
}

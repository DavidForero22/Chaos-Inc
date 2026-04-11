import type { ReactNode } from "react";
import styles from "./AuthModal.module.css";

interface AuthModalLayoutProps {
	title: string;
	subtitle: string;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	isLoading: boolean;
	submitText: string;
	loadingText: string;
	switchButton?: ReactNode; // El botón de "Ya tengo cuenta" o "¿Sin cuenta?"
	children: ReactNode; // Aquí irán los inputs específicos
}

export default function AuthModalLayout({
	title,
	subtitle,
	onClose,
	onSubmit,
	isLoading,
	submitText,
	loadingText,
	switchButton,
	children,
}: AuthModalLayoutProps) {
	return (
		<div className={styles.overlay} onClick={onClose}>
			<div className={styles.card} onClick={(e) => e.stopPropagation()}>
				<div className={styles.marginLine} />

				{/* Cabecera dinámica */}
				<div className={styles.header}>
					<div>
						<p className={styles.headerTitle}>
							{title}
							<span className={styles.headerSub}>{subtitle}</span>
						</p>
					</div>
					<button className={styles.closeBtn} onClick={onClose} title="Cerrar">
						✕
					</button>
				</div>

				{/* Cuerpo dinámico */}
				<form onSubmit={onSubmit}>
					<div className={styles.body}>{children}</div>

					{/* Pie dinámico */}
					<div className={styles.footer}>
						{switchButton && <div>{switchButton}</div>}

						<div className={styles.actions}>
							<button
								type="button"
								className={styles.btnSecondary}
								onClick={onClose}
							>
								Cancelar
							</button>
							<button
								type="submit"
								className={styles.btnPrimary}
								disabled={isLoading}
							>
								{isLoading ? loadingText : submitText}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

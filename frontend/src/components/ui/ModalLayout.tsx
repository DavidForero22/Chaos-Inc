// Accesibilidad comprobada: SI

import type { ReactNode } from "react";
import styles from "./ModalLayout.module.css";

interface ModalLayoutProps {
	title: string;
	subtitle: string;
	onClose: () => void;
	onSubmit?: (e: React.FormEvent) => void;
	isLoading?: boolean;
	submitText?: string;
	loadingText?: string;
	switchButton?: ReactNode;
	children: ReactNode;
	disableBackdropClick?: boolean;
	hideSubmit?: boolean;
}

export default function ModalLayout({
	title,
	subtitle,
	onClose,
	onSubmit = (e) => e.preventDefault(),
	isLoading = false,
	submitText = "Aceptar",
	loadingText = "Procesando...",
	switchButton,
	children,
	disableBackdropClick = false,
	hideSubmit = false,
}: ModalLayoutProps) {
	const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget && !disableBackdropClick) {
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Escape" && !disableBackdropClick) {
			onClose();
		}
	};

	return (
		<div
			className={styles.overlay}
			onClick={handleBackdropClick}
			onKeyDown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			aria-describedby="modal-description"
		>
			<div className={styles.card} onClick={(e) => e.stopPropagation()}>
				{/* Cabecera dinámica (Fija) */}
				<div className={styles.header}>
					<div>
						<p className={styles.headerTitle}>
							<span id="modal-title" className={styles.headerTitleText}>
								{title}
							</span>
							<span id="modal-description" className={styles.headerSub}>
								{subtitle}
							</span>
						</p>
					</div>
					<button
						className={styles.closeBtn}
						onClick={onClose}
						title="Cerrar"
						aria-label="Cerrar modal"
					>
						✕
					</button>
				</div>

				<form
					className={styles.formWrapper}
					onSubmit={onSubmit}
					aria-label={title}
				>
					{/* Cuerpo dinámico (Con Scroll) */}
					<div className={styles.body}>{children}</div>

					{/* Pie dinámico (Fijo) */}
					<div className={styles.footer}>
						{switchButton ? <div>{switchButton}</div> : <div />}

						<div className={styles.actions}>
							{!hideSubmit && (
								<>
									<button
										type="button"
										className={styles.btnSecondary}
										onClick={onClose}
										aria-label="Cancelar y cerrar modal"
									>
										Cancelar
									</button>
									<button
										type="submit"
										className={styles.btnPrimary}
										disabled={isLoading}
										aria-label={isLoading ? loadingText : submitText}
										aria-disabled={isLoading}
									>
										{isLoading ? loadingText : submitText}
									</button>
								</>
							)}
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

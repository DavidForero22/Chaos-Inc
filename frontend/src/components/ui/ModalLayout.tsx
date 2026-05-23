// src/components/ui/ModalLayout.tsx

import type { ReactNode } from "react";
import AnimatedOverlay from "../../layouts/site-overlay/AnimatedOverlay.tsx";
import { useModalOverlay } from "../../hooks/useModalOverlay";
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
	closeOnly?: boolean;
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
	closeOnly = false,
}: ModalLayoutProps) {
	// Usar el hook para manejar las animaciones de cierre
	const { isClosing, closeAnimated, handleBackdropClick } = useModalOverlay(
		onClose,
		disableBackdropClick,
	);

	const ContentWrapper = closeOnly ? "div" : "form";
	const wrapperProps = closeOnly ? {} : { onSubmit, "aria-label": title };

	return (
		<AnimatedOverlay
			isClosing={isClosing}
			onBackdropClick={handleBackdropClick}
			ariaLabelledby="modal-title"
			ariaDescribedby="modal-description"
		>
			<div className={styles.card}>
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
					{/* Sustituir onClose por closeAnimated */}
					<button
						className={styles.closeBtn}
						onClick={closeAnimated}
						title="Cerrar"
						aria-label="Cerrar modal"
					>
						✕
					</button>
				</div>

				<ContentWrapper className={styles.formWrapper} {...wrapperProps}>
					<div className={styles.body}>{children}</div>
					<div className={styles.footer}>
						{switchButton ? <div>{switchButton}</div> : <div />}
						<div className={styles.actions}>
							{closeOnly ? (
								<button
									type="button"
									className={styles.btnPrimary}
									onClick={closeAnimated}
								>
									Cerrar
								</button>
							) : !hideSubmit ? (
								<>
									<button
										type="button"
										className={styles.btnSecondary}
										onClick={closeAnimated}
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
								</>
							) : null}
						</div>
					</div>
				</ContentWrapper>
			</div>
		</AnimatedOverlay>
	);
}

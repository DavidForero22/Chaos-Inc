// src/components/ui/AnimatedOverlay.tsx

import type { ReactNode } from "react";
import styles from "./AnimatedOverlay.module.css";

interface AnimatedOverlayProps {
	children: ReactNode;
	isClosing: boolean;
	onBackdropClick: (e: React.MouseEvent<HTMLDivElement>) => void;
	role?: string;
	ariaModal?: boolean;
	ariaLabelledby?: string;
	ariaDescribedby?: string;
}

export default function AnimatedOverlay({
	children,
	isClosing,
	onBackdropClick,
	role = "dialog",
	ariaModal = true,
	ariaLabelledby,
	ariaDescribedby,
}: AnimatedOverlayProps) {
	return (
		<div
			className={`${styles.overlay} ${isClosing ? styles.fadeOut : styles.fadeIn}`}
			onClick={onBackdropClick}
			role={role}
			aria-modal={ariaModal}
			aria-labelledby={ariaLabelledby}
			aria-describedby={ariaDescribedby}
		>
			<div
				className={`${styles.contentContainer} ${isClosing ? styles.slideDown : styles.slideUp}`}
				onClick={(e) =>
					e.stopPropagation()
				} /* Evitar que el clic en el contenido cierre el modal */
			>
				{children}
			</div>
		</div>
	);
}

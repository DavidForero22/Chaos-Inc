// src/components/ui/GameModal.tsx

import type { ReactNode } from "react";
import styles from "./GameModal.module.css";

interface ModalProps {
	children: ReactNode;
	maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
}

export function Modal({ children, maxWidth = "max-w-2xl" }: ModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-md animate-fade-in p-4">
			{/* CARCASA EXTERIOR (Plástico del Monitor) */}
			<div className={`${styles.monitorCasing} ${maxWidth} w-full text-left`}>
				{/* CRISTAL DE LA PANTALLA */}
				<div className={styles.screen}>
					{/* EL CONTENIDO DEL JUEGO (Lo que inyecta cada modal específico) */}
					<div className={styles.content}>{children}</div>
				</div>
			</div>
		</div>
	);
}

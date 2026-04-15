// src/components/ui/GameModal.tsx

import type { ReactNode } from "react";

interface ModalProps {
	children: ReactNode;
	maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl"; // Añadido 2xl
}

export function Modal({ children, maxWidth = "max-w-2xl" }: ModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#393e42]/80 backdrop-blur-sm animate-fade-in p-4">
			<div
				className={`bg-[#d2d4d1] border-[3px] border-[#393e42] rounded-sm shadow-2xl ${maxWidth} w-full text-left relative overflow-hidden font-mono text-[#393e42]`}
				style={{
					// Líneas de la libreta
					backgroundImage:
						"repeating-linear-gradient(transparent, transparent 31px, rgba(146, 158, 156, 0.35) 31px, rgba(146, 158, 156, 0.35) 32px)",
					lineHeight: "32px",
				}}
			>
				{/* Margen rojo vertical clásico */}
				<div className="absolute top-0 bottom-0 left-[50px] w-[2px] bg-[rgba(220,50,50,0.2)] pointer-events-none" />

				{/* Contenedor principal con padding adaptado al margen */}
				<div className="relative z-10 p-8 pl-[70px]">{children}</div>
			</div>
		</div>
	);
}

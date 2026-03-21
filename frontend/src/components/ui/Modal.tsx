import type { ReactNode } from "react";

interface ModalProps {
	children: ReactNode;
	maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl";
}

export function Modal({ children, maxWidth = "max-w-md" }: ModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
			<div
				className={`bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-8 ${maxWidth} w-full mx-4 text-center`}
			>
				{children}
			</div>
		</div>
	);
}

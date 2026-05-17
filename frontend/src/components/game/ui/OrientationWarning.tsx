// src/components/ui/OrientationWarning.tsx

import { useEffect, useState } from "react";

export function OrientationWarning() {
	const [isPortrait, setIsPortrait] = useState(false);

	useEffect(() => {
		const checkOrientation = () => {
			// Consideramos portrait si el alto es mayor que el ancho
			setIsPortrait(window.innerHeight > window.innerWidth);
		};

		window.addEventListener("resize", checkOrientation);
		checkOrientation(); // Comprobación inicial

		return () => window.removeEventListener("resize", checkOrientation);
	}, []);

	if (!isPortrait) return null;

	return (
		<div
			className="fixed inset-0 z-9999 bg-[#2c1a12] text-[#d2d4d1] flex flex-col items-center justify-center p-8 text-center"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<svg
				className="w-24 h-24 mb-8 animate-pulse text-[#c19a6b]"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				/>
			</svg>
			<h1 className="text-2xl font-black uppercase tracking-widest mb-4">
				Rotación Requerida
			</h1>
			<p className="text-lg opacity-80">
				Por favor, gira tu dispositivo para entrar a la oficina.
			</p>
		</div>
	);
}

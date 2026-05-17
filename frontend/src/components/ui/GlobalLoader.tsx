// Accesibilidad comprobada: SI

import { useLoadingStore } from "../../store/ui/useLoadingStore";

export function GlobalLoader() {
	const { requestCount, message } = useLoadingStore();

	if (requestCount === 0) return null;

	return (
		<div
			className="fixed inset-0 z-9999 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center"
			role="alert"
			aria-live="assertive"
			aria-busy="true"
			aria-label="Cargando contenido, por favor espera"
		>
			{/* Spinner animado - decorativo */}
			<div
				className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4 shadow-lg"
				aria-hidden="true"
			></div>

			<h2 className="text-xl font-bold text-white animate-pulse tracking-widest uppercase">
				{message}
			</h2>
		</div>
	);
}

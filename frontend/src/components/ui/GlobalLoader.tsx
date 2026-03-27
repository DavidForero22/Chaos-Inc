import { useLoadingStore } from "../../store/useLoadingStore";

export function GlobalLoader() {
	const requestCount = useLoadingStore((state) => state.requestCount);

	if (requestCount === 0) return null;

	return (
		<div className="fixed inset-0 z-9999 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
			{/* Spinner animado */}
			<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4 shadow-lg"></div>
			<h2 className="text-xl font-bold text-white animate-pulse tracking-widest">
				CARGANDO...
			</h2>
		</div>
	);
}

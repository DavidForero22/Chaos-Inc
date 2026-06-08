// src/components/rooms/ActiveGameBanner.tsx
import { useNavigate } from "react-router-dom";
import { FaGamepad } from "react-icons/fa";

interface ActiveGameBannerProps {
	roomId: string;
	roomName: string;
}

export default function ActiveGameBanner({
	roomId,
	roomName,
}: ActiveGameBannerProps) {
	const navigate = useNavigate();

	return (
		<div
			className="fixed bottom-6 right-6 z-50 bg-[#1e2326] text-white p-4 rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-l-4 border-green-500 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300"
			role="alert"
			aria-live="polite"
		>
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 animate-pulse">
					<FaGamepad size={20} />
				</div>
				<div>
					<p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
						Partida en Curso
					</p>
					<p
						className="text-sm font-black truncate max-w-37.5 sm:max-w-50"
						title={roomName}
					>
						{roomName}
					</p>
				</div>
			</div>

			<button
				onClick={() => navigate(`/game/${roomId}`)}
				className="w-full sm:w-auto px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap"
			>
				Volver a la Mesa
			</button>
		</div>
	);
}

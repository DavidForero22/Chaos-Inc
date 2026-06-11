import { Link } from "react-router-dom";
import { useLeaderboard } from "../../hooks/leaderboard/useLeaderboard";
import { LeaderboardAvatar } from "./LeaderboardAvatar";

// ─── PÁGINA PRINCIPAL ───
export default function LeaderboardPage() {
	const { users, isLoading } = useLeaderboard();

	return (
		<main className="pl-6 pb-10 pr-6">
			{/* Título principal */}
			<h1
				className="text-4xl mb-6 font-black"
				style={{ color: "var(--color-lomo)" }}
			>
				CLASIFICACIÓN
			</h1>

			{/* Subtítulo semántico */}
			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Los Mejores Empleados
			</h2>

			{/* Cuerpo del manual / Introducción */}
			<div className="space-y-6 text-gray-800 leading-relaxed mb-10">
				<p>
					Aquí se encuentran los empleados más dedicados de Chaos Inc. Asciende
					en la jerarquía acumulando experiencia en las partidas y demuestra
					quién manda realmente en la oficina.
				</p>
				<p className="italic text-sm text-gray-600">
					Nota: Los invitados no figuran en este registro.
				</p>
			</div>

			{/* Contenedor del Leaderboard */}
			<div>
				{isLoading ? (
					/* Spinner de carga local */
					<div className="flex justify-center items-center py-12">
						<svg
							className="animate-spin h-10 w-10 text-gray-600"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							></circle>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
					</div>
				) : (
					/* Lista de usuarios */
					<div className="space-y-5">
						{users.map((user, index) => {
							const rank = index + 1;

							let rankColor = "text-gray-700";
							let rankSize = "text-2xl";
							let frameStyle = "border-gray-800 bg-[#fbfbf9] shadow-sm";
							let frameThickness = "border-[3px]";

							if (rank === 1) {
								rankColor = "text-yellow-600 drop-shadow-md";
								rankSize = "text-4xl";
								frameStyle =
									"border-[#d4af37] bg-gradient-to-r from-yellow-50 to-white shadow-md";
								frameThickness = "border-[6px] border-double";
							} else if (rank === 2) {
								rankColor = "text-gray-500 drop-shadow-md";
								rankSize = "text-3xl";
								frameStyle =
									"border-[#a8a9ad] bg-gradient-to-r from-gray-50 to-white shadow-md";
								frameThickness = "border-[6px] border-double";
							} else if (rank === 3) {
								rankColor = "text-orange-600 drop-shadow-md";
								rankSize = "text-3xl";
								frameStyle =
									"border-[#cd7f32] bg-gradient-to-r from-orange-50 to-white shadow-md";
								frameThickness = "border-[6px] border-double";
							}

							return (
								<Link
									key={user.id}
									to={`/profile/${user.id}`}
									className={`flex items-center p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-sm relative ${frameThickness} ${frameStyle}`}
									aria-label={`Ver perfil de ${user.username}`}
								>
									<div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black/20 shadow-inner"></div>

									{/* Posición */}
									<div
										className={`font-black w-14 text-center ${rankColor} ${rankSize}`}
									>
										#{rank}
									</div>

									{/* Avatar */}
									<LeaderboardAvatar
										avatarUrl={user.avatar}
										username={user.username}
									/>

									{/* Info Usuario */}
									<div className="grow">
										<h3 className="text-xl font-bold m-0 text-gray-900 leading-tight tracking-wide">
											{user.username}
										</h3>
										<p className="text-sm font-semibold text-gray-600 m-0 uppercase tracking-widest mt-1">
											Nivel {user.level}
										</p>
									</div>

									{/* Experiencia */}
									<div className="font-mono font-bold text-lg text-white bg-gray-800 px-3 py-1 rounded-sm shadow-inner">
										{user.total_xp.toLocaleString()}{" "}
										<span className="text-xs">XP</span>
									</div>
								</Link>
							);
						})}

						{/* Estado vacío */}
						{users.length === 0 && (
							<div className="text-center py-8 italic text-gray-500 border-t border-gray-300">
								Aún no hay expedientes registrados en la base de datos.
							</div>
						)}
					</div>
				)}
			</div>
		</main>
	);
}

import { Link } from "react-router-dom";
import { useLeaderboard } from "../../hooks/leaderboard/useLeaderboard";
import { LeaderboardAvatar } from "./LeaderboardAvatar";

// ─── PÁGINA PRINCIPAL ───
export default function LeaderboardPage() {
	const { users, isLoading } = useLeaderboard();

	return (
		<main className="pl-6 pb-10 pr-6">
			{/* Cabecera */}
			<header className="mb-8 md:mb-10">
				<h1
					className="text-4xl mb-6 font-black"
					style={{ color: "var(--color-lomo)" }}
				>
					CLASIFICACIÓN
				</h1>
				<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
					Los Mejores Empleados
				</h2>

				<div className="space-y-6 text-gray-800 leading-relaxed mb-10">
					<p>
						Aquí se encuentran los empleados más dedicados de Chaos Inc.
						Asciende en la jerarquía acumulando experiencia en las partidas y
						demuestra quién manda realmente en la oficina.
					</p>
					<p className="italic text-xs md:text-sm text-gray-600">
						Nota: Los invitados no figuran en este registro.
					</p>
				</div>
			</header>

			{/* Contenedor del Leaderboard */}
			<section aria-live="polite">
				{isLoading ? (
					/* Spinner de carga */
					<div
						role="status"
						className="flex flex-col justify-center items-center py-12 gap-4"
					>
						<svg
							aria-hidden="true"
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
						<span className="sr-only">
							Cargando clasificación de empleados...
						</span>
					</div>
				) : (
					/* Lista de usuarios */
					<div className="flex flex-col gap-3 md:gap-4">
						{users.map((user, index) => {
							const rank = index + 1;

							// Valores por defecto
							let rankColor = "text-[#7a8a92]";
							let rankSize = "text-xl md:text-2xl";
							let frameStyle =
								"border-gray-800 bg-black/5 hover:bg-black/10 shadow-sm";
							let frameThickness = "border md:border-[2px]";

							// Top 3 (Oro, Plata, Bronce)
							if (rank === 1) {
								rankColor = "text-[#d4af37] drop-shadow-md"; // Oro
								rankSize = "text-3xl md:text-4xl";
								frameStyle =
									"border-[#d4af37] bg-gradient-to-r from-yellow-50 to-white shadow-md";
								frameThickness = "border-[3px] md:border-[5px] border-double";
							} else if (rank === 2) {
								rankColor = "text-[#a8a9ad] drop-shadow-md"; // Plata
								rankSize = "text-2xl md:text-[1.8rem]";
								frameStyle =
									"border-[#a8a9ad] bg-gradient-to-r from-gray-50 to-white shadow-md";
								frameThickness = "border-[3px] md:border-[5px] border-double";
							} else if (rank === 3) {
								rankColor = "text-[#cd7f32] drop-shadow-md"; // Bronce
								rankSize = "text-2xl md:text-[1.6rem]";
								frameStyle =
									"border-[#cd7f32] bg-gradient-to-r from-orange-50 to-white shadow-md";
								frameThickness = "border-[3px] md:border-[5px] border-double";
							}

							return (
								<Link
									key={user.id}
									to={`/profile/${user.id}`}
									className={`flex items-center gap-2 md:gap-4 p-3 md:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-lg relative ${frameThickness} ${frameStyle}`}
									aria-label={`Posición ${rank}: ${user.username}, Nivel ${user.level}, ${user.total_xp} puntos de experiencia`}
									title={`Ver perfil de ${user.username}`}
								>
									{/* Detalle decorativo (Oculto a lectores) */}
									<div
										aria-hidden="true"
										className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-black/20 shadow-inner"
									></div>

									{/* Posición */}
									<div
										aria-hidden="true"
										className={`font-black w-8 md:w-14 text-center shrink-0 ${rankColor} ${rankSize}`}
									>
										#{rank}
									</div>

									{/* Avatar */}
									<div aria-hidden="true" className="shrink-0">
										<LeaderboardAvatar
											avatarUrl={user.avatar}
											username={user.username}
										/>
									</div>

									{/* Info Usuario (Crece para ocupar el centro) */}
									<div aria-hidden="true" className="grow min-w-0">
										<h3 className="text-lg md:text-xl font-bold m-0 text-gray-900 leading-tight tracking-wide truncate">
											{user.username}
										</h3>
										<p className="text-xs md:text-sm font-semibold text-[#5c6b75] m-0 uppercase tracking-widest mt-0.5 md:mt-1">
											Nivel {user.level}
										</p>
									</div>

									{/* Experiencia */}
									<div
										aria-hidden="true"
										className="shrink-0 font-mono font-bold text-sm md:text-lg text-white bg-[#295c60] px-2 md:px-3 py-1 rounded-sm shadow-inner"
									>
										{user.total_xp.toLocaleString()}{" "}
										<span className="text-[10px] md:text-xs font-sans">XP</span>
									</div>
								</Link>
							);
						})}

						{/* Estado vacío */}
						{users.length === 0 && (
							<div className="text-center py-8 italic text-[#7a8a92] border-t border-gray-300">
								Aún no hay expedientes registrados en la base de datos.
							</div>
						)}
					</div>
				)}
			</section>
		</main>
	);
}

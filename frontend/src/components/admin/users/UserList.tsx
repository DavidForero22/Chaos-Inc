import { useState } from "react";
import { Link } from "react-router-dom";

// Mapeo de roles a español
const roleLabels: Record<string, string> = {
	admin: "Administrador",
	user: "Usuario",
	guest: "Invitado",
};

interface UserListProps {
	users: any[];
	currentUserId: string | number | null;
	onEdit: (user: any) => void;
	onDelete: (id: number) => void;
	onGenerateTemp: (id: number) => Promise<string>;
	getDisplayRole: (role: string, isGuest: boolean) => string;
}

export default function UserList({
	users,
	currentUserId,
	onEdit,
	onDelete,
	onGenerateTemp,
	getDisplayRole,
}: UserListProps) {
	const [tempPasswordData, setTempPasswordData] = useState<{
		username: string;
		password: string;
	} | null>(null);

	const handleGeneratePassword = async (id: number, username: string) => {
		if (
			window.confirm(
				`ADVERTENCIA:\n\n¿Estás seguro de que deseas generar una nueva contraseña temporal para ${username}?\n\nSu contraseña actual será sobrescrita y no podrá recuperarse.`,
			)
		) {
			try {
				const newPassword = await onGenerateTemp(id);
				setTempPasswordData({ username, password: newPassword });
			} catch (error: any) {
				alert(
					error.response?.data?.message ||
						"Error al generar la contraseña temporal.",
				);
			}
		}
	};

	if (users.length === 0) {
		return (
			<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
				Sin resultados
			</p>
		);
	}

	return (
		<div className="flex flex-col">
			{/* ── MODAL DE CONTRASEÑA TEMPORAL ── */}
			{tempPasswordData && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="bg-[#d2d4d1] border-2 border-[#295c60] p-6 max-w-sm w-full shadow-2xl rounded-sm font-mono">
						<h3 className="font-black text-lg mb-2 uppercase text-[#8b2c2c] border-b border-gray-400 pb-1">
							Credencial Generada
						</h3>
						<p className="text-sm mb-4 text-[#393e42] leading-relaxed">
							Se ha generado una nueva contraseña de un solo uso para{" "}
							<strong>{tempPasswordData.username}</strong>. Cópiala y envíasela
							de forma segura.
							<br />
							<br />
							<span className="italic opacity-80">
								Nota: No volverá a mostrarse.
							</span>
						</p>

						{/* Caja de selección fácil */}
						<div className="bg-white p-4 text-center text-2xl tracking-widest font-black text-[#295c60] border-2 border-dashed border-[#295c60]/50 select-all cursor-text">
							{tempPasswordData.password}
						</div>

						<button
							onClick={() => setTempPasswordData(null)}
							className="mt-6 w-full py-2 bg-[#295c60] hover:bg-[#1a3a3d] transition-colors text-[#d2d4d1] font-bold uppercase text-xs tracking-widest cursor-pointer"
						>
							Cerrar y Aceptar
						</button>
					</div>
				</div>
			)}

			{/* ── LISTADO DE USUARIOS ── */}
			{users.map((u) => {
				const isMe = String(u.id) === String(currentUserId);
				const displayRole = getDisplayRole(u.role, u.isGuest);

				return (
					<div
						key={u.id}
						className="py-4 border-b border-dashed border-gray-400/50"
					>
						<div className="flex justify-between items-center">
							<div>
								<span className="font-bold text-lg">
									#{u.id} <span className="mx-2 opacity-50">|</span>{" "}
									<Link
										to={`/profile/${u.id}`}
										className="hover:underline hover:text-[#295c60] transition-colors"
									>
										{u.username}
									</Link>
									{isMe && (
										<span className="ml-2 text-xs text-[#295c60] italic">
											(TÚ)
										</span>
									)}
									{/* Etiqueta de Rol */}
									<span
										className={`ml-3 text-xs px-2 py-0.5 border ${
											displayRole === "admin"
												? "border-red-700 text-red-700 bg-red-100/50"
												: displayRole === "guest"
													? "border-orange-600 text-orange-700 bg-orange-100/50"
													: "border-blue-700 text-blue-700 bg-blue-100/50"
										}`}
									>
										{roleLabels[displayRole]?.toUpperCase()}
									</span>
								</span>
								<p className="text-sm opacity-70 mt-1">
									<span className="font-bold">Email:</span>{" "}
									{u.email || "Oculto"} <span className="mx-2">|</span>{" "}
									<span className="font-bold">Creación:</span>{" "}
									{new Date(u.joinedAt).toLocaleDateString("es-ES")}
								</p>
							</div>
							<div className="flex gap-3 items-center">
								{isMe ? (
									<span className="text-xs font-bold text-gray-500 opacity-60 italic tracking-widest">
										[SESIÓN ACTIVA - INMODIFICABLE]
									</span>
								) : displayRole === "guest" ? (
									<button
										onClick={() => onDelete(u.id)}
										className="text-sm font-bold text-red-700 hover:underline cursor-pointer"
									>
										ELIMINAR
									</button>
								) : (
									<>
										{/* NUEVO BOTÓN DE CONTRASEÑA */}
										<button
											onClick={() => handleGeneratePassword(u.id, u.username)}
											className="text-sm font-bold text-[#b17112] hover:underline cursor-pointer "
										>
											CONTRASEÑA TEMPORAL
										</button>
										<button
											onClick={() => onEdit(u)}
											className="text-sm font-bold text-blue-700 hover:underline cursor-pointer"
										>
											EDITAR
										</button>
										<button
											onClick={() => onDelete(u.id)}
											className="text-sm font-bold text-red-700 hover:underline cursor-pointer"
										>
											ELIMINAR
										</button>
									</>
								)}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

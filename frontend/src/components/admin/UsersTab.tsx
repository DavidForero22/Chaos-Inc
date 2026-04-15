// src/components/admin/UsersTab.tsx

import { useState } from "react";
import type { UserRecord } from "../../types/api.ts";

interface Props {
	users: UserRecord[];
	currentUser?: string | null; // Añadimos la prop opcional
	onDelete: (id: number) => Promise<void>;
	onUpdate: (
		id: number,
		data: { username: string; email: string; role: string },
	) => Promise<void>;
	onCreate: (data: {
		username: string;
		email: string;
		password: string;
		role: string;
	}) => Promise<void>;
}

export default function UsersTab({
	users,
	currentUser,
	onDelete,
	onUpdate,
	onCreate,
}: Props) {
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editData, setEditData] = useState({
		username: "",
		email: "",
		role: "user",
	});

	const [showCreate, setShowCreate] = useState(false);
	const [createData, setCreateData] = useState({
		username: "",
		email: "",
		password: "",
		role: "user",
	});

	const handleDelete = async (id: number) => {
		if (!confirm("¿Proceder con el despido (eliminar usuario)?")) return;
		try {
			await onDelete(id);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al eliminar.");
		}
	};

	const handleSave = async (id: number) => {
		try {
			await onUpdate(id, editData);
			setEditingId(null);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al actualizar.");
		}
	};

	const handleCreate = async () => {
		try {
			await onCreate(createData);
			setCreateData({ username: "", email: "", password: "", role: "user" });
			setShowCreate(false);
		} catch (e: any) {
			alert(e.response?.data?.message || "Error al crear empleado.");
		}
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Botón de Alta de Empleado */}
			<div className="flex justify-between items-end mb-2">
				<h3 className="font-bold text-lg underline decoration-2 uppercase">
					Registro de Empleados
				</h3>
				<button
					onClick={() => setShowCreate(!showCreate)}
					className="px-4 py-2 border-2 border-[#295c60] text-[#295c60] font-bold text-xs uppercase hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors"
				>
					{showCreate ? "Cancelar Alta" : "+ Dar de Alta"}
				</button>
			</div>

			{/* Formulario de Creación */}
			{showCreate && (
				<div className="bg-gray-400/10 border-2 border-dashed border-[#295c60]/50 p-4 flex flex-wrap gap-4 items-end mb-4">
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Nombre
						</label>
						<input
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.username}
							onChange={(e) =>
								setCreateData({ ...createData, username: e.target.value })
							}
							placeholder="Identificador"
						/>
					</div>
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Email
						</label>
						<input
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.email}
							onChange={(e) =>
								setCreateData({ ...createData, email: e.target.value })
							}
							placeholder="correo@empresa.com"
						/>
					</div>
					<div className="flex-1 min-w-37.5">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Clave
						</label>
						<input
							type="password"
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
							value={createData.password}
							onChange={(e) =>
								setCreateData({ ...createData, password: e.target.value })
							}
							placeholder="••••••••"
						/>
					</div>
					<div className="w-24">
						<label className="block text-xs font-bold uppercase opacity-70 mb-1">
							Cargo
						</label>
						<select
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none cursor-pointer"
							value={createData.role}
							onChange={(e) =>
								setCreateData({ ...createData, role: e.target.value })
							}
						>
							<option value="user">User</option>
							<option value="admin">Admin</option>
						</select>
					</div>
					<button
						onClick={handleCreate}
						className="px-4 py-2 bg-[#295c60] text-[#d2d4d1] font-bold text-xs uppercase"
					>
						Procesar
					</button>
				</div>
			)}

			{/* Listado de Usuarios */}
			<div className="flex flex-col">
				{users.map((u) => {
					const isMe = u.username === currentUser;

					return (
						<div
							key={u.id}
							className="py-4 border-b border-dashed border-gray-400/50"
						>
							{editingId === u.id ? (
								<div className="flex flex-wrap gap-4 items-end bg-gray-400/10 p-3 -mx-3 rounded">
									<input
										className="flex-1 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
										value={editData.username}
										onChange={(e) =>
											setEditData({ ...editData, username: e.target.value })
										}
									/>
									<input
										className="flex-1 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none focus:border-[#295c60]"
										value={editData.email}
										onChange={(e) =>
											setEditData({ ...editData, email: e.target.value })
										}
									/>
									<select
										className="w-24 bg-transparent border-b-2 border-gray-400 px-2 py-1 outline-none"
										value={editData.role}
										onChange={(e) =>
											setEditData({ ...editData, role: e.target.value })
										}
									>
										<option value="user">user</option>
										<option value="admin">admin</option>
									</select>
									<div className="flex gap-2">
										<button
											onClick={() => handleSave(u.id)}
											className="px-3 py-1 bg-[#295c60] text-white text-xs font-bold uppercase"
										>
											Guardar
										</button>
										<button
											onClick={() => setEditingId(null)}
											className="px-3 py-1 border border-gray-500 text-gray-600 text-xs font-bold uppercase"
										>
											Cancelar
										</button>
									</div>
								</div>
							) : (
								<div className="flex justify-between items-center">
									<div>
										<p className="font-bold text-lg flex items-center">
											{u.username}
											{isMe && (
												<span className="ml-2 text-xs text-[#295c60] italic">
													(TÚ)
												</span>
											)}
											<span
												className={`ml-3 text-xs px-2 py-0.5 border ${
													u.role === "admin"
														? "border-red-700 text-red-700 bg-red-100/50"
														: "border-blue-700 text-blue-700 bg-blue-100/50"
												}`}
											>
												{u.role.toUpperCase()}
											</span>
										</p>
										<p className="text-sm opacity-70 mt-1">
											<span className="font-bold">Email:</span> {u.email}{" "}
											<span className="mx-2">|</span>{" "}
											<span className="font-bold">Alta:</span>{" "}
											{new Date(u.joinedAt).toLocaleDateString("es-ES")}
										</p>
									</div>
									<div className="flex gap-3 items-center">
										{/* Condicional de seguridad visual */}
										{isMe ? (
											<span className="text-xs font-bold text-gray-500 opacity-60 italic tracking-widest">
												[SESIÓN ACTIVA - INMODIFICABLE]
											</span>
										) : (
											<>
												<button
													onClick={() => {
														setEditingId(u.id);
														setEditData({
															username: u.username,
															email: u.email,
															role: u.role,
														});
													}}
													className="text-sm font-bold text-blue-700 hover:underline"
												>
													EDITAR
												</button>
												<button
													onClick={() => handleDelete(u.id)}
													className="text-sm font-bold text-red-700 hover:underline"
												>
													ELIMINAR
												</button>
											</>
										)}
									</div>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

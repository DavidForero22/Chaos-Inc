import { useState } from "react";
import type { UserRecord } from "../../types/api.ts";

interface Props {
	users: UserRecord[];
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
		if (!confirm("¿Eliminar este usuario?")) return;
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
			alert(e.response?.data?.message || "Error al crear usuario.");
		}
	};

	return (
		<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
			<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
				Usuarios registrados
			</h2>

			{/* Boton crear usuario */}
			<div className="flex justify-end mb-2">
				<button
					onClick={() => setShowCreate(!showCreate)}
					className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm font-bold"
				>
					{showCreate ? "Cancelar" : "+ Nuevo usuario"}
				</button>
			</div>

			{/* Modal creacion de usuario */}
			{showCreate && (
				<div className="bg-gray-900 rounded-lg border border-blue-800 p-4 flex flex-col gap-2 mb-2">
					<input
						className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
						value={createData.username}
						onChange={(e) =>
							setCreateData({ ...createData, username: e.target.value })
						}
						placeholder="Username"
					/>
					<input
						className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
						value={createData.email}
						onChange={(e) =>
							setCreateData({ ...createData, email: e.target.value })
						}
						placeholder="Email"
					/>
					<input
						type="password"
						className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
						value={createData.password}
						onChange={(e) =>
							setCreateData({ ...createData, password: e.target.value })
						}
						placeholder="Contraseña"
					/>
					<select
						className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
						value={createData.role}
						onChange={(e) =>
							setCreateData({ ...createData, role: e.target.value })
						}
					>
						<option value="user">user</option>
						<option value="admin">admin</option>
					</select>
					<button
						onClick={handleCreate}
						className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-bold"
					>
						Crear usuario
					</button>
				</div>
			)}

			{/* Listado de usuarios */}
			{users.map((u) => (
				<div
					key={u.id}
					className="bg-gray-900 rounded-lg border border-gray-700 p-4"
				>
					{editingId === u.id ? (
						<div className="flex flex-col gap-2">
							<input
								className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
								value={editData.username}
								onChange={(e) =>
									setEditData({ ...editData, username: e.target.value })
								}
								placeholder="Username"
							/>
							<input
								className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
								value={editData.email}
								onChange={(e) =>
									setEditData({ ...editData, email: e.target.value })
								}
								placeholder="Email"
							/>
							<select
								className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
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
									className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-sm font-bold"
								>
									Guardar
								</button>
								<button
									onClick={() => setEditingId(null)}
									className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
								>
									Cancelar
								</button>
							</div>
						</div>
					) : (
						<div className="flex justify-between items-center">
							<div>
								<p className="text-white font-bold">
									{u.username}
									<span
										className={`ml-2 text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-red-900 text-red-400" : "bg-gray-700 text-gray-400"}`}
									>
										{u.role}
									</span>
								</p>
								<p className="text-gray-500 text-xs">
									{u.email} · {new Date(u.joinedAt).toLocaleDateString("es-ES")}
								</p>
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => {
										setEditingId(u.id);
										setEditData({
											username: u.username,
											email: u.email,
											role: u.role,
										});
									}}
									className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
								>
									Editar
								</button>
								<button
									onClick={() => handleDelete(u.id)}
									className="px-3 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 rounded text-sm"
								>
									Eliminar
								</button>
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
}

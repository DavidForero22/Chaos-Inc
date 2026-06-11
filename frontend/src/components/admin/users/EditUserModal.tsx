import { useEffect, useState } from "react";
import TabsModalLayout from "../../ui/Modals/TabsModalLayout";
import type { TabDefinition } from "../../ui/Modals/TabsModalLayout";
import type { UserRecord } from "../../../types/user";
import { ACHIEVEMENTS } from "../../../data/app/achievements";
import { useUsersData } from "../../../hooks/admin/useUsersData";
import { useToastStore } from "../../../store/ui/useToastStore";
import { getFullAvatarUrl } from "../../../utils/avatar";

interface EditUserModalProps {
	user: UserRecord;
	onClose: () => void;
	onSave: (id: number, data: any) => Promise<void>;
}

const TABS: TabDefinition[] = [
	{ id: "profile", label: "Perfil" },
	{ id: "security", label: "Seguridad" },
	{ id: "progress", label: "Progreso" },
];

export default function EditUserModal({
	user,
	onClose,
	onSave,
}: EditUserModalProps) {
	const { getUserById } = useUsersData();
	const [activeTab, setActiveTab] = useState<string>("profile");

	// ── ESTADOS DE CARGA Y DATOS COMPLETOS ──
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [fullUser, setFullUser] = useState<UserRecord | null>(null);

	const showToast = useToastStore((state) => state.showToast);

	// ── ESTADO DEL FORMULARIO ──
	const [formData, setFormData] = useState({
		username: user.username,
		email: user.email || "",
		role: user.role,
		unlinkGoogle: false,
		unlinkDiscord: false,
		resetAvatar: false,
		resetXp: false,
		activeAchievements: [] as string[],
	});

	// ── EFECTO: CARGAR DATOS DEL SERVIDOR AL ABRIR EL MODAL ──
	useEffect(() => {
		let isMounted = true;

		const fetchDetails = async () => {
			try {
				const detailedUser = await getUserById(user.id);
				if (isMounted) {
					setFullUser(detailedUser);
					setFormData((prev) => ({
						...prev,
						email: detailedUser.email || prev.email,
						activeAchievements:
							detailedUser.achievements?.map((a: any) => a.id) || [],
					}));
					setIsLoadingData(false);
				}
			} catch (error) {
				console.error("Error al cargar los detalles del usuario:", error);
				if (isMounted) setIsLoadingData(false);
			}
		};

		fetchDetails();

		return () => {
			isMounted = false;
		};
	}, [user.id]); // Solo se ejecuta una vez al montar

	// ── HELPERS DINÁMICOS ──
	const hasGoogle = fullUser?.socialAccounts?.some(
		(acc) => acc.provider === "google",
	);
	const hasDiscord = fullUser?.socialAccounts?.some(
		(acc) => acc.provider === "discord",
	);
	const hasPassword = fullUser?.hasPassword ?? false;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			await onSave(user.id, formData);
		} catch (error) {
			console.error("Error al guardar:", error);
			setIsSaving(false);
		}
	};

	// ── INTERCEPTOR DE SEGURIDAD ──
	const handleUnlinkToggle = (
		provider: "google" | "discord",
		checked: boolean,
	) => {
		// Solo verificar si está intentando marcar la desvinculación
		if (checked && !hasPassword) {
			showToast(
				"El usuario no tiene una contraseña. Antes de desvincular todas sus redes sociales, genera una contraseña temporal.",
				"warn",
			);
			return;
		}

		if (provider === "google")
			setFormData((prev) => ({ ...prev, unlinkGoogle: checked }));
		if (provider === "discord")
			setFormData((prev) => ({ ...prev, unlinkDiscord: checked }));
	};

	const toggleAchievement = (achId: string) => {
		setFormData((prev) => {
			const isActive = prev.activeAchievements.includes(achId);
			if (isActive) {
				return {
					...prev,
					activeAchievements: prev.activeAchievements.filter(
						(id) => id !== achId,
					),
				};
			}
			return {
				...prev,
				activeAchievements: [...prev.activeAchievements, achId],
			};
		});
	};

	// ── RENDERIZADO DEL SPINNER DE CARGA INICIAL ──
	if (isLoadingData) {
		return (
			<TabsModalLayout
				title={`EXPEDIENTE #${user.id}`}
				subtitle={`Cargando a: ${user.username}...`}
				tabs={TABS}
				activeTab={activeTab}
				onTabChange={() => {}}
				onClose={onClose}
				onSubmit={(e) => e.preventDefault()}
			>
				<div className="flex justify-center items-center h-48">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				</div>
			</TabsModalLayout>
		);
	}

	return (
		<TabsModalLayout
			title={`EXPEDIENTE #${user.id}`}
			subtitle={`Editando a: ${user.username}`}
			tabs={TABS}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			onClose={onClose}
			onSubmit={handleSubmit}
			isLoading={isSaving}
			submitText="Guardar Cambios"
		>
			{/* ── PESTAÑA 1: PERFIL ── */}
			{activeTab === "profile" && (
				<div className="space-y-4">
					{/* Campos de texto */}
					<div>
						<label
							htmlFor="edit-username"
							className="block text-xs font-bold uppercase opacity-70 mb-1 text-[#4a5553] tracking-widest"
						>
							Nombre de usuario
						</label>
						<input
							id="edit-username"
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-2 outline-none focus:border-[#295c60] text-lg font-bold text-[#393e42]"
							value={formData.username}
							onChange={(e) =>
								setFormData({ ...formData, username: e.target.value })
							}
							required
						/>
					</div>
					<div>
						<label
							htmlFor="edit-email"
							className="block text-xs font-bold uppercase opacity-70 mb-1 text-[#4a5553] tracking-widest mt-6"
						>
							Correo Electrónico
						</label>
						<input
							id="edit-email"
							type="email"
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-2 outline-none focus:border-[#295c60] text-[#393e42]"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
						/>
					</div>
					<div>
						<label
							htmlFor="edit-role"
							className="block text-xs font-bold uppercase opacity-70 mb-1 text-[#4a5553] tracking-widest mt-6"
						>
							Rol del usuario
						</label>
						<select
							id="edit-role"
							className="w-full bg-transparent border-b-2 border-gray-400 px-2 py-2 outline-none cursor-pointer text-[#393e42] font-bold uppercase"
							value={formData.role}
							onChange={(e) =>
								setFormData({ ...formData, role: e.target.value })
							}
						>
							<option value="user">Usuario Estándar</option>
							<option value="admin">Administrador</option>
							{user.isGuest && <option value="guest">Invitado</option>}
						</select>
					</div>

					{/* Previsualización y purga de Avatar */}
					<div className="mt-8 flex items-center gap-4 p-3 bg-black/5 border border-black/10 rounded-sm">
						<div className="w-12 h-12 rounded-sm overflow-hidden bg-white border-2 border-gray-400 shrink-0 flex items-center justify-center">
							{user.avatar && !formData.resetAvatar ? (
								<img
									src={getFullAvatarUrl(user.avatar) ?? undefined}
									alt="Avatar"
									className="w-full h-full object-cover"
									referrerPolicy="no-referrer"
								/>
							) : (
								<span className="text-xl font-black text-gray-400 opacity-50">
									{formData.username.substring(0, 2).toUpperCase()}
								</span>
							)}
						</div>
						<div className="flex-1">
							<span className="block font-bold text-[#393e42] text-sm uppercase">
								Avatar del usuario
							</span>
							<span className="text-xs opacity-70">
								{formData.resetAvatar
									? "Se eliminará al guardar cambios."
									: "Avatar actual en el sistema."}
							</span>
						</div>
						<label className="flex items-center gap-2 cursor-pointer">
							<span className="text-xs font-bold text-[#8b2c2c] uppercase">
								Eliminar
							</span>
							{/* Toggle visual */}
							<div
								className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.resetAvatar ? "bg-[#8b2c2c]" : "bg-gray-400"}`}
							>
								<span
									className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.resetAvatar ? "translate-x-5" : "translate-x-1"}`}
								/>
							</div>
							<input
								type="checkbox"
								className="sr-only"
								checked={formData.resetAvatar}
								onChange={(e) =>
									setFormData({ ...formData, resetAvatar: e.target.checked })
								}
							/>
						</label>
					</div>
				</div>
			)}

			{/* ── PESTAÑA 2: SEGURIDAD ── */}
			{activeTab === "security" && (
				<div className="space-y-4">
					<p className="text-sm opacity-70 italic border-b border-dashed border-gray-400 pb-2 mb-4">
						Opciones para revocar accesos externos del usuario.
					</p>

					<label
						className={`flex items-center justify-between p-3 bg-red-900/5 border border-red-900/20 rounded-sm ${!hasGoogle ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
					>
						<div>
							<span className="block font-bold text-[#8b2c2c] uppercase text-sm">
								Desvincular Google
							</span>
							<span className="text-xs opacity-70">
								{!hasGoogle
									? "No hay cuenta vinculada."
									: "Rompe la conexión con Google OAuth."}
							</span>
						</div>
						<div
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.unlinkGoogle ? "bg-[#8b2c2c]" : "bg-gray-400"}`}
						>
							<span
								className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.unlinkGoogle ? "translate-x-5" : "translate-x-1"}`}
							/>
						</div>
						<input
							type="checkbox"
							className="sr-only"
							checked={formData.unlinkGoogle}
							onChange={(e) => handleUnlinkToggle("google", e.target.checked)}
							disabled={!hasGoogle}
						/>
					</label>

					<label
						className={`flex items-center justify-between p-3 bg-red-900/5 border border-red-900/20 rounded-sm ${!hasDiscord ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
					>
						<div>
							<span className="block font-bold text-[#8b2c2c] uppercase text-sm">
								Desvincular Discord
							</span>
							<span className="text-xs opacity-70">
								{!hasDiscord
									? "No hay cuenta vinculada."
									: "Rompe la conexión con Discord OAuth."}
							</span>
						</div>
						<div
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.unlinkDiscord ? "bg-[#8b2c2c]" : "bg-gray-400"}`}
						>
							<span
								className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.unlinkDiscord ? "translate-x-5" : "translate-x-1"}`}
							/>
						</div>
						<input
							type="checkbox"
							className="sr-only"
							checked={formData.unlinkDiscord}
							onChange={(e) => handleUnlinkToggle("discord", e.target.checked)}
							disabled={!hasDiscord}
						/>
					</label>
				</div>
			)}

			{/* ── PESTAÑA 3: PROGRESO ── */}
			{activeTab === "progress" && (
				<div className="space-y-6">
					{/* Controles de Reset XP */}
					<label className="flex items-center justify-between p-3 bg-[#295c60]/5 border border-[#295c60]/20 rounded-sm cursor-pointer">
						<div>
							<span className="block font-bold text-[#295c60] text-sm uppercase">
								Resetear Experiencia
							</span>
							<span className="text-xs opacity-70">
								Devuelve la cuenta a 0 XP. Se aplicará al guardar.
							</span>
						</div>
						<div
							className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.resetXp ? "bg-[#295c60]" : "bg-gray-400"}`}
						>
							<span
								className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.resetXp ? "translate-x-5" : "translate-x-1"}`}
							/>
						</div>
						<input
							type="checkbox"
							className="sr-only"
							checked={formData.resetXp}
							onChange={(e) =>
								setFormData({ ...formData, resetXp: e.target.checked })
							}
						/>
					</label>

					{/* Gestión de Logros sin el div que rompía el max-height */}
					<div>
						<h3 className="font-bold uppercase text-sm border-b border-dashed border-gray-400 pb-1 mb-3">
							Catálogo de Logros
						</h3>
						<div className="space-y-2">
							{ACHIEVEMENTS.map((ach) => (
								<label
									key={ach.id}
									className="flex items-center justify-between p-2 hover:bg-black/5 cursor-pointer rounded transition-colors"
								>
									<span className="text-sm font-bold opacity-80">
										{ach.title}
									</span>

									{/* Toggle visual */}
									<div
										className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${formData.activeAchievements.includes(ach.id) ? "bg-[#295c60]" : "bg-gray-400"}`}
									>
										<span
											className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.activeAchievements.includes(ach.id) ? "translate-x-5" : "translate-x-1"}`}
										/>
									</div>

									{/* Input real oculto */}
									<input
										type="checkbox"
										className="sr-only"
										checked={formData.activeAchievements.includes(ach.id)}
										onChange={() => toggleAchievement(ach.id)}
									/>
								</label>
							))}
						</div>
					</div>
				</div>
			)}
		</TabsModalLayout>
	);
}

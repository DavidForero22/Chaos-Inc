// src/components/profile/UserNameAndActions.tsx
import { IoPersonAddSharp, IoPersonRemove } from "react-icons/io5";
import { IoIosMail } from "react-icons/io";
import { MdMenuBook } from "react-icons/md";
import styles from "./UserInfo.module.css";

interface UserNameAndActionsProps {
	displayUser?: string | null;
	displayRole?: string | null;
	notMyProfile: boolean;
	onFriendRequest?: () => void;
	onGallery?: () => void;
	onOpenFriendRequests?: () => void;
	pendingReceivedCount?: number;
	isSendingRequest?: boolean;
	isFriend?: boolean;
	onRemoveFriend?: () => void;
}

export default function UserNameAndActions({
	displayUser,
	displayRole,
	notMyProfile,
	onFriendRequest,
	onGallery,
	onOpenFriendRequests,
	pendingReceivedCount = 0,
	isSendingRequest = false,
	isFriend = false,
	onRemoveFriend,
}: UserNameAndActionsProps) {
	return (
		<div className={styles.employeeData}>
			<div className={styles.formGroup}>
				<label id="user-name-label" htmlFor="user-name">
					NOMBRE:
				</label>
				<div className={`${styles.formValue} flex flex-col`}>
					{/* Nombre y rol */}
					<div className="flex items-center gap-4">
						<h1
							id="user-name"
							className={styles.employeeName}
							aria-labelledby="user-name-label"
						>
							{displayUser}
						</h1>
						{displayRole && (
							<div className="justify-center">
								<span
									className={`text-xs font-black font-mono uppercase px-2 py-0 border border-black rounded-sm text-black ${
										displayRole === "admin" ? "bg-amber-300" : "bg-blue-300"
									}`}
									aria-label={`Rol: ${displayRole}`}
								>
									{displayRole === "admin" ? "Admin" : "Usuario"}
								</span>
							</div>
						)}
					</div>
				</div>
				{/* Botones del perfil */}
				<div className="flex justify-end mt-4 gap-2">
					{notMyProfile ? (
						isFriend ? (
							// Borrar amigo
							<button
								className="p-1 rounded-md border border-gray-400 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors cursor-pointer disabled:opacity-50"
								aria-label={`Eliminar a ${displayUser} de amigos`}
								title={`Eliminar a ${displayUser} de amigos`}
								onClick={onRemoveFriend}
								disabled={isSendingRequest}
							>
								<IoPersonRemove size={28} aria-hidden="true" />
							</button>
						) : (
							// Agregar amigo
							<button
								className="p-1 rounded-md border border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-50"
								aria-label={`Enviar solicitud de amistad a ${displayUser}`}
								title={`Enviar solicitud de amistad a ${displayUser}`}
								onClick={onFriendRequest}
								disabled={isSendingRequest}
							>
								<IoPersonAddSharp size={28} aria-hidden="true" />
							</button>
						)
					) : (
						<>
							{/* Botón de solicitudes (correo) con badge */}
							<button
								className="relative p-1 rounded-md border border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
								aria-label="Ver solicitudes de amistad"
								title="Bandeja de solicitudes"
								onClick={onOpenFriendRequests}
							>
								<IoIosMail size={28} aria-hidden="true" />
								{pendingReceivedCount > 0 && (
									<span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
										{pendingReceivedCount}
									</span>
								)}
							</button>
							{/* Galería */}
							<button
								className="p-1 rounded-md border border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
								aria-label="Ver galería de desbloqueables"
								title="Ver galería de desbloqueables"
								onClick={onGallery}
							>
								<MdMenuBook size={28} aria-hidden="true" />
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

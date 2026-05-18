// src/components/profile/UserNameAndActions.tsx
import { IoPersonAddSharp } from "react-icons/io5";
import { MdMenuBook } from "react-icons/md";
import styles from "./UserInfo.module.css";

interface UserNameAndActionsProps {
	displayUser?: string | null;
	displayRole?: string | null;
	notMyProfile: boolean;
	onFriendRequest?: () => void;
	onGallery?: () => void;
}

export default function UserNameAndActions({
	displayUser,
	displayRole,
	notMyProfile,
	onFriendRequest,
	onGallery,
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
				<div className="flex justify-end mt-4">
					{notMyProfile ? (
						<button
							className="p-1 rounded-md border border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
							aria-label={`Enviar solicitud de amistad a ${displayUser}`}
							title={`Enviar solicitud de amistad a ${displayUser}`}
							onClick={onFriendRequest}
						>
							<IoPersonAddSharp size={28} aria-hidden="true" />
						</button>
					) : (
						<button
							className="p-1 rounded-md border border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
							aria-label="Ver galería de desbloqueables"
							title="Ver galería de desbloqueables"
							onClick={onGallery}
						>
							<MdMenuBook size={28} aria-hidden="true" />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

// src/components/profile/FriendRequestsModal.tsx

import { useState } from "react";
import ModalLayout from "../../ui/ModalLayout";
import type { FriendRequest } from "../../../types/user";
import { getFullAvatarUrl } from "../../../utils/avatar";

interface FriendRequestsModalProps {
	show: boolean;
	onClose: () => void;
	pendingReceived: FriendRequest[];
	pendingSent: FriendRequest[];
	isLoading: boolean;
	onAcceptRequest: (userId: number) => void;
	onRejectRequest: (userId: number) => void;
	onCancelRequest: (userId: number) => void;
}

export default function FriendRequestsModal({
	show,
	onClose,
	pendingReceived,
	pendingSent,
	isLoading,
	onAcceptRequest,
	onRejectRequest,
	onCancelRequest,
}: FriendRequestsModalProps) {
	const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

	if (!show) return null;

	// Helper para obtener la URL completa del avatar
	const getAvatarUrl = (avatar: string | null): string | null => {
		return getFullAvatarUrl(avatar);
	};

	return (
		<ModalLayout
			title="BANDEJA DE SOLICITUDES"
			subtitle="Gestiona tus amistades"
			onClose={onClose}
			closeOnly
		>
			<div className="flex flex-col gap-4 py-2">
				{/* Pestañas */}
				<div className="flex border-b border-gray-300" role="tablist">
					<button
						role="tab"
						aria-selected={activeTab === "received"}
						onClick={() => setActiveTab("received")}
						className={`px-4 py-2 font-mono text-sm uppercase font-bold ${
							activeTab === "received"
								? "border-b-2 border-black text-black"
								: "text-gray-500 hover:text-black"
						}`}
					>
						Solicitudes entrantes
						{pendingReceived.length > 0 && (
							<span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
								{pendingReceived.length}
							</span>
						)}
					</button>
					<button
						role="tab"
						aria-selected={activeTab === "sent"}
						onClick={() => setActiveTab("sent")}
						className={`px-4 py-2 font-mono text-sm uppercase font-bold ${
							activeTab === "sent"
								? "border-b-2 border-black text-black"
								: "text-gray-500 hover:text-black"
						}`}
					>
						Solicitudes salientes
					</button>
				</div>

				{/* Contenido scrolleable */}
				<div className="max-h-64 overflow-y-auto">
					{isLoading && (
						<p className="text-center text-sm text-gray-500 py-4">
							Cargando...
						</p>
					)}
					{!isLoading && activeTab === "received" && (
						<>
							{pendingReceived.length === 0 ? (
								<p className="text-center text-sm text-gray-500 py-4">
									No tienes solicitudes entrantes
								</p>
							) : (
								<ul className="space-y-3">
									{pendingReceived.map((req) => {
										const avatarUrl = getAvatarUrl(req.user.avatar);
										return (
											<li
												key={req.id}
												className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
											>
												{/* Avatar */}
												<div className="shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold overflow-hidden">
													{avatarUrl ? (
														<img
															src={avatarUrl}
															alt={req.user.username}
															className="w-full h-full rounded-full object-cover"
															referrerPolicy="no-referrer"
														/>
													) : (
														<span className="text-sm">
															{req.user.username.charAt(0).toUpperCase()}
														</span>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-mono font-bold text-sm truncate">
														{req.user.username}
													</p>
												</div>
												<div className="flex gap-2">
													<button
														onClick={() => onAcceptRequest(req.user.id)}
														className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase px-3 py-1 rounded transition-colors"
													>
														Aceptar
													</button>
													<button
														onClick={() => onRejectRequest(req.user.id)}
														className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase px-3 py-1 rounded transition-colors"
													>
														Rechazar
													</button>
												</div>
											</li>
										);
									})}
								</ul>
							)}
						</>
					)}
					{!isLoading && activeTab === "sent" && (
						<>
							{pendingSent.length === 0 ? (
								<p className="text-center text-sm text-gray-500 py-4">
									No tienes solicitudes salientes
								</p>
							) : (
								<ul className="space-y-3">
									{pendingSent.map((req) => {
										const avatarUrl = getAvatarUrl(req.user.avatar);
										return (
											<li
												key={req.id}
												className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200"
											>
												<div className="shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold overflow-hidden">
													{avatarUrl ? (
														<img
															src={avatarUrl}
															alt={req.user.username}
															className="w-full h-full rounded-full object-cover"
															referrerPolicy="no-referrer"
														/>
													) : (
														<span className="text-sm">
															{req.user.username.charAt(0).toUpperCase()}
														</span>
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-mono font-bold text-sm truncate">
														{req.user.username}
													</p>
												</div>
												<button
													onClick={() => onCancelRequest(req.user.id)}
													className="bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold uppercase px-3 py-1 rounded transition-colors"
												>
													Cancelar
												</button>
											</li>
										);
									})}
								</ul>
							)}
						</>
					)}
				</div>
			</div>
		</ModalLayout>
	);
}

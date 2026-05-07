import { useEffect, useState } from "react";
import { useNotificationStore } from "../../../store/useNotificationStore";
import type { GameNotification } from "../../../store/useNotificationStore";
import { RiSwordFill } from "react-icons/ri";
import { GiTrophyCup,GiHealthNormal } from "react-icons/gi";
import { BsBackpack2Fill } from "react-icons/bs";
import { FaRunning, FaTrash, FaUsers } from "react-icons/fa";
import { IoIosLock } from "react-icons/io";
import { IoHandLeftSharp } from "react-icons/io5";

// Importamos el nuevo CSS
import styles from "./NotificationStack.module.css";

const ICON_MAP: Record<string, React.ElementType> = {
	attack: RiSwordFill,
	heal: GiHealthNormal,
	perk: BsBackpack2Fill,
	dodge: FaRunning,
	steal: IoHandLeftSharp,
	block: IoIosLock,
	discard: FaTrash,
	all: FaUsers,achievement: GiTrophyCup ,
};

const STYLE_MAP: Record<string, string> = {
	attack:
		"bg-red-600 text-white border-red-800 shadow-[0_4px_12px_rgba(220,38,38,0.5)]",
	heal: "bg-green-600 text-white border-green-800 shadow-[0_4px_12px_rgba(22,163,74,0.5)]",
	perk: "bg-amber-500 text-black border-amber-700 shadow-[0_4px_12px_rgba(245,158,11,0.5)]",
	default:
		"bg-gray-700 text-white border-gray-900 shadow-[0_4px_12px_rgba(55,65,81,0.5)]",
};

// Subcomponente que maneja su propia animación de salida
function NotificationItem({ notif }: { notif: GameNotification }) {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsExiting(true);
		}, 3600);

		return () => clearTimeout(timer);
	}, []);

	const Icon = ICON_MAP[notif.iconKey] || ICON_MAP.default;
	const colorStyle = STYLE_MAP[notif.type] || STYLE_MAP.default;

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transform ${colorStyle} ${
				isExiting ? styles.notificationExit : styles.notificationEnter
			}`}
		>
			<div className="shrink-0 flex items-center justify-center opacity-90">
				<Icon size={18} />
			</div>
			<p className="text-sm font-bold leading-tight font-sans">
				{notif.message}
			</p>
		</div>
	);
}

export function NotificationStack() {
	const notifications = useNotificationStore((state) => state.notifications);

	return (
		<div className="fixed top-24 right-4 z-50 flex flex-col gap-3 pointer-events-none w-64 items-end overflow-visible">
			{notifications.map((notif) => (
				<NotificationItem key={notif.id} notif={notif} />
			))}
		</div>
	);
}

import { useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS } from "../../data/achievements";
import { useAchievementNotificationStore } from "../../store/useAchievementNotificationStore";
import styles from "./AchievementNotification.module.css";

function AchievementNotificationItem({
	achievementId,
}: {
	achievementId: string;
}) {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsExiting(true);
		}, 4700);

		return () => clearTimeout(timer);
	}, []);

	const achievement = useMemo(
		() => ACHIEVEMENTS.find((a) => a.id === achievementId),
		[achievementId],
	);

	const title = achievement?.title ?? achievementId;
	const description = achievement?.technicalDescription ?? "";
	const image = achievement?.image ?? "/achievements/ach_placeholder.png";

	return (
		<div
			className={`pointer-events-auto w-80 rounded-xl border-2 border-amber-400 bg-amber-50/95 px-4 py-3 shadow-lg ${
				isExiting ? styles.toastExit : styles.toastEnter
			}`}
		>
			<h4 className="text-xs font-black uppercase tracking-wide text-amber-700">
				¡Logro desbloqueado!
			</h4>

			<div className="mt-2 flex items-center gap-3">
				<img
					src={image}
					alt={title}
					className="h-12 w-12 shrink-0 object-contain"
				/>
				<div className="min-w-0">
					<p className="text-sm font-bold text-stone-900">{title}</p>
					<p className="text-xs text-stone-600">{description}</p>
				</div>
			</div>
		</div>
	);
}

export function AchievementNotification() {
	const notifications = useAchievementNotificationStore(
		(state) => state.notifications,
	);

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
			{notifications.map((notif) => (
				<AchievementNotificationItem
					key={notif.id}
					achievementId={notif.achievementId}
				/>
			))}
		</div>
	);
}

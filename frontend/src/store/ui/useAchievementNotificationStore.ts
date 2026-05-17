import { create } from "zustand";

export interface AchievementNotification {
	id: string;
	achievementId: string;
}

interface AchievementNotificationState {
	notifications: AchievementNotification[];
	addAchievementNotification: (achievementId: string) => void;
	removeAchievementNotification: (id: string) => void;
}

export const useAchievementNotificationStore =
	create<AchievementNotificationState>((set) => ({
		notifications: [],
		addAchievementNotification: (achievementId) => {
			const id =
				typeof crypto !== "undefined" && "randomUUID" in crypto
					? crypto.randomUUID()
					: Math.random().toString(36).substring(2, 9);

			set((state) => ({
				notifications: [...state.notifications, { id, achievementId }],
			}));

			setTimeout(() => {
				set((state) => ({
					notifications: state.notifications.filter((n) => n.id !== id),
				}));
			}, 5200);
		},
		removeAchievementNotification: (id) =>
			set((state) => ({
				notifications: state.notifications.filter((n) => n.id !== id),
			})),
	}));

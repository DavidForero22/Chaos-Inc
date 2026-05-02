// src/store/useNotificationStore.ts

import { create } from "zustand";

export type NotificationType = "attack" | "heal" | "perk" | "default";

export interface GameNotification {
	id: string;
	type: NotificationType;
	message: string;
	iconKey: string;
}

// Interfaz para los registros persistentes
export interface LogEntry {
	id: string;
	timestamp: string;
	message: string;
}

interface NotificationState {
	// --- Notificaciones Efímeras (Burbujas derecha) ---
	notifications: GameNotification[];
	addNotification: (notif: Omit<GameNotification, "id">) => void;
	removeNotification: (id: string) => void;

	// --- Registros Persistentes (GameLog / Slack) ---
	logs: LogEntry[];
	addLog: (message: string) => void;
	clearLogs: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
	// 1. ESTADO DE NOTIFICACIONES EFÍMERAS
	notifications: [],

	addNotification: (notif) => {
		const id = Math.random().toString(36).substring(2, 9);

		set((state) => {
			const current =
				state.notifications.length >= 5
					? state.notifications.slice(1)
					: state.notifications;

			return { notifications: [...current, { ...notif, id }] };
		});

		setTimeout(() => {
			set((state) => ({
				notifications: state.notifications.filter((n) => n.id !== id),
			}));
		}, 4000);
	},

	removeNotification: (id) =>
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		})),

	// 2. ESTADO DE REGISTROS (LOGS)
	logs: [],

	addLog: (message) =>
		set((state) => {
			const now = new Date();
			const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
			const newEntry: LogEntry = {
				id:
					typeof crypto !== "undefined" && crypto.randomUUID
						? crypto.randomUUID()
						: Math.random().toString(36).substring(2, 15),
				timestamp,
				message,
			};
			return { logs: [...state.logs, newEntry] };
		}),

	clearLogs: () => set({ logs: [] }),
}));

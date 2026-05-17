// src/store/useToastStore.ts
import { create } from "zustand";

export type ToastType = "info" | "success" | "warn" | "danger";

interface ToastStore {
	isVisible: boolean;
	message: string;
	type: ToastType;
	showToast: (message: string, type: ToastType) => void;
	hideToast: () => void;
}

export const useToastStore = create<ToastStore>((set) => {
	let timeoutId: ReturnType<typeof setTimeout>;

	return {
		isVisible: false,
		message: "",
		type: "info",
		showToast: (message, type) => {
			if (timeoutId) clearTimeout(timeoutId);
			set({ isVisible: true, message, type });

			timeoutId = setTimeout(() => {
				set({ isVisible: false });
			}, 4000);
		},
		hideToast: () => {
			if (timeoutId) clearTimeout(timeoutId);
			set({ isVisible: false });
		},
	};
});

// src/store/useLoadingStore.ts
import { create } from "zustand";

interface LoadingState {
	requestCount: number;
	message: string;
	startLoading: (msg?: string) => void;
	stopLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
	requestCount: 0,
	message: "CARGANDO...",

	startLoading: (msg?: string) =>
		set((state) => ({
			requestCount: state.requestCount + 1,
			message: msg ? msg : "CARGANDO...",
		})),

	stopLoading: () =>
		set((state) => {
			const newCount = Math.max(0, state.requestCount - 1);
			return {
				requestCount: newCount,
				message: newCount === 0 ? "CARGANDO..." : state.message,
			};
		}),
}));

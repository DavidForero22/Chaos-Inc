import { create } from "zustand";

interface LoadingState {
	requestCount: number;
	startLoading: () => void;
	stopLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
	requestCount: 0,
	startLoading: () =>
		set((state) => ({ requestCount: state.requestCount + 1 })),
	stopLoading: () =>
		set((state) => ({
			requestCount: Math.max(0, state.requestCount - 1),
		})),
}));

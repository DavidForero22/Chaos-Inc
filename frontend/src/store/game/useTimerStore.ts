import { create } from "zustand";

interface TimerState {
	multiAttackSecondsLeft: number | null;
	sabotageSecondsLeft: number | null;
	singleAttackSecondsLeft: number | null;
	luckChallengeSecondsLeft: number | null;

	setMultiAttackSecondsLeft: (
		seconds: number | null | ((prev: number | null) => number | null),
	) => void;
	setSabotageSecondsLeft: (
		seconds: number | null | ((prev: number | null) => number | null),
	) => void;
	setSingleAttackSecondsLeft: (
		seconds: number | null | ((prev: number | null) => number | null),
	) => void;
	setLuckChallengeSecondsLeft: (
		seconds: number | null | ((prev: number | null) => number | null),
	) => void;
}

export const useTimerStore = create<TimerState>((set) => ({
	multiAttackSecondsLeft: null,
	sabotageSecondsLeft: null,
	singleAttackSecondsLeft: null,
	luckChallengeSecondsLeft: null,

	setMultiAttackSecondsLeft: (updater) =>
		set((state) => ({
			multiAttackSecondsLeft:
				typeof updater === "function"
					? updater(state.multiAttackSecondsLeft)
					: updater,
		})),
	setSabotageSecondsLeft: (updater) =>
		set((state) => ({
			sabotageSecondsLeft:
				typeof updater === "function"
					? updater(state.sabotageSecondsLeft)
					: updater,
		})),
	setSingleAttackSecondsLeft: (updater) =>
		set((state) => ({
			singleAttackSecondsLeft:
				typeof updater === "function"
					? updater(state.singleAttackSecondsLeft)
					: updater,
		})),
	setLuckChallengeSecondsLeft: (updater) =>
		set((state) => ({
			luckChallengeSecondsLeft:
				typeof updater === "function"
					? updater(state.luckChallengeSecondsLeft)
					: updater,
		})),
}));

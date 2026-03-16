import { useState, useCallback } from "react";

export function useGameEvents(syncGame: () => Promise<void>) {
	const [isActingBossAssigned, setIsActingBossAssigned] = useState(false);
	const [internGraceCancelled, setInternGraceCancelled] = useState(false);
	const [actingBossGraceTrigger, setActingBossGraceTrigger] = useState(0);

	const handleActingBossAssigned = useCallback(async () => {
		setIsActingBossAssigned(true);
		await syncGame();
	}, [syncGame]);

	const handleActingBossGrace = useCallback(() => {
		setActingBossGraceTrigger((n) => n + 1);
	}, []);

	const handleActingBossGraceCancelled = useCallback(() => {
		setInternGraceCancelled(true);
	}, []);

	return {
		isActingBossAssigned,
		setIsActingBossAssigned,
		internGraceCancelled,
		setInternGraceCancelled,
		actingBossGraceTrigger,
		handleActingBossAssigned,
		handleActingBossGrace,
		handleActingBossGraceCancelled,
	};
}

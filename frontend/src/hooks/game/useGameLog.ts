import { useState, useCallback } from "react";

export interface LogEntry {
	id: number;
	message: string;
	timestamp: string;
}

export function useGameLog() {
	const [logs, setLogs] = useState<LogEntry[]>([]);

	const addLog = useCallback((message: string) => {
		if (!message) return;
		setLogs((prev) =>
			[
				{
					id: Date.now(),
					message,
					timestamp: new Date().toLocaleTimeString("es-ES", {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					}),
				},
				...prev,
			].slice(0, 100),
		); // máximo 100 entradas
	}, []);

	return { logs, addLog };
}

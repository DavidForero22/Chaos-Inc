// src/components/game/player/PlayerBanners.tsx
// Accesibilidad comprobada: SI

import { useTimerStore } from "../../../store/useTimerStore.ts";
import type { MyData } from "../../../types/live-game.ts";
import styles from "./PlayerBanners.module.css";


interface PlayerBannersProps {
	me: MyData;
}

export function PlayerBanners({ me }: PlayerBannersProps) {
	// Timers
	const multiAttackSecondsLeft = useTimerStore(
		(state) => state.multiAttackSecondsLeft,
	);
	const sabotageSecondsLeft = useTimerStore(
		(state) => state.sabotageSecondsLeft,
	);
	const singleAttackSecondsLeft = useTimerStore(
		(state) => state.singleAttackSecondsLeft,
	);

	return (
		<aside
			aria-label="Notificaciones críticas"
			className={styles.bannersContainer}
		>
			{/* Ataque simple entrante */}
			{me.combat_state.is_defending_single &&
				singleAttackSecondsLeft !== null && (
					<div className={styles.warningSlip}>
						{/* LA ALERTA: Se lee una sola vez al aparecer */}
						<div role="alert" className="sr-only">
							¡Alerta Urgente! Ataque entrante. Tienes tiempo limitado.
						</div>

						{/* LO VISUAL: Se oculta a la voz para evitar spam */}
						<div aria-hidden="true" className={styles.header}>
							URGENTE
						</div>
						<div className={styles.content}>
							<span aria-hidden="true">¡Ataque entrante!</span>

							{/* EL RELOJ: Manejado de forma independiente */}
							<span
								role="timer"
								aria-atomic="true"
								className={styles.timerStamp}
							>
								<span className="sr-only">
									Tiempo restante: {singleAttackSecondsLeft} segundos
								</span>
								<span aria-hidden="true">{singleAttackSecondsLeft}s</span>
							</span>
						</div>
					</div>
				)}

			{/* Ataque global entrante */}
			{me.combat_state.is_defending_multi &&
				multiAttackSecondsLeft !== null && (
					<div className={styles.warningSlip}>
						<div role="alert" className="sr-only">
							¡Alerta Urgente! Ataque masivo entrante.
						</div>

						<div aria-hidden="true" className={styles.header}>
							URGENTE
						</div>
						<div className={styles.content}>
							<span aria-hidden="true">¡Ataque masivo entrante!</span>
							<span
								role="timer"
								aria-atomic="true"
								className={styles.timerStamp}
							>
								<span className="sr-only">
									Tiempo restante: {multiAttackSecondsLeft} segundos
								</span>
								<span aria-hidden="true">{multiAttackSecondsLeft}s</span>
							</span>
						</div>
					</div>
				)}

			{/* Sabotaje pendiente */}
			{me.conditions.must_discard && sabotageSecondsLeft !== null && (
				<div className={`${styles.warningSlip} ${styles.warningSlipOrange}`}>
					<div role="alert" className="sr-only">
						Notificación de sabotaje. ¡Descarta una carta inmediatamente!
					</div>

					<div
						aria-hidden="true"
						className={`${styles.header} ${styles.headerOrange}`}
					>
						NOTIFICACIÓN
					</div>
					<div className={styles.content}>
						<span aria-hidden="true">¡Descarta una carta!</span>
						<span
							role="timer"
							aria-atomic="true"
							className={`${styles.timerStamp} ${styles.timerStampOrange}`}
						>
							<span className="sr-only">
								Tiempo restante: {sabotageSecondsLeft} segundos
							</span>
							<span aria-hidden="true">{sabotageSecondsLeft}s</span>
						</span>
					</div>
				</div>
			)}
		</aside>
	);
}

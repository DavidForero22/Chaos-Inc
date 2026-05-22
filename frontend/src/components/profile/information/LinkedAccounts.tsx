// src/components/profile/LinkedAccounts.tsx

import styles from "./UserInfo.module.css";

interface LinkedAccountsProps {
	isDiscordLinked?: boolean;
	isGoogleLinked?: boolean;
	onProviderClick: (provider: string, isLinked: boolean) => void;
}

export default function LinkedAccounts({
	isDiscordLinked = false,
	isGoogleLinked = false,
	onProviderClick,
}: LinkedAccountsProps) {
	return (
		<div className={styles.linkedAccountsSection}>
			<label id="linked-accounts-label">CUENTAS VINCULADAS:</label>
			<div
				className={styles.providerContainer}
				role="group"
				aria-labelledby="linked-accounts-label"
			>
				<button
					type="button"
					onClick={() => onProviderClick("discord", isDiscordLinked)}
					className={`${styles.providerBadge} ${styles.badgeDiscord} ${!isDiscordLinked ? styles.badgeUnlinked : ""} transition-transform hover:scale-105`}
					aria-label={
						isDiscordLinked
							? "Desvincular cuenta de Discord"
							: "Conectar cuenta de Discord"
					}
				>
					DISCORD
				</button>
				<button
					type="button"
					onClick={() => onProviderClick("google", isGoogleLinked)}
					className={`${styles.providerBadge} ${styles.badgeGoogle} ${!isGoogleLinked ? styles.badgeUnlinked : ""} transition-transform hover:scale-105`}
					aria-label={
						isGoogleLinked
							? "Desvincular cuenta de Google"
							: "Conectar cuenta de Google"
					}
				>
					GOOGLE
				</button>
			</div>
		</div>
	);
}

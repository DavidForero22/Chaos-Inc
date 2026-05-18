// src/components/profile/FriendList.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import type { FriendSummary } from "../../../types/user";
import styles from "./FriendList.module.css";
import viewStyles from "../RegisteredProfileView.module.css";

const VISIBLE_DEFAULT = 6;

interface FriendListProps {
	friends?: FriendSummary[];
}

function getInitials(username: string): string {
	return username.slice(0, 2).toUpperCase();
}

function getLevelFromXp(xp: number): number {
	// Misma lógica que LevelProgressBar — ajusta si la tuya es distinta
	return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function FriendCard({ friend }: { friend: FriendSummary }) {
	const level = getLevelFromXp(friend.totalXp ?? 0);

	return (
		<div
			className={styles.friendCard}
			role="listitem"
			tabIndex={0}
			aria-label={`${friend.username}, nivel ${level}`}
		>
			<div className={styles.avatarWrapper}>
				{friend.avatar ? (
					<img
						src={friend.avatar}
						alt=""
						aria-hidden="true"
						className={styles.avatarImg}
					/>
				) : (
					<div className={styles.avatarInitials} aria-hidden="true">
						{getInitials(friend.username)}
					</div>
				)}
			</div>

			<span className={styles.friendName}>{friend.username}</span>
			<span className={styles.friendXp}>NV. {level}</span>
		</div>
	);
}

export default function FriendList({ friends = [] }: FriendListProps) {
	const [expanded, setExpanded] = useState(false);

	const hasMore = friends.length > VISIBLE_DEFAULT;
	const visible = expanded ? friends : friends.slice(0, VISIBLE_DEFAULT);
	const hiddenCount = friends.length - VISIBLE_DEFAULT;

	return (
		<section aria-labelledby="friends-heading">
			<h2 id="friends-heading" className={viewStyles.sectionLabel}>
				AMIGOS
			</h2>

			<div className={styles.friendsSection}>
				{friends.length === 0 ? (
					<p className={styles.emptyState}>Aún no tienes amigos agregados</p>
				) : (
					<>
						<div
							className={styles.friendsGrid}
							role="list"
							aria-label={`Lista de amigos, ${friends.length} en total`}
						>
							{visible.map((friend) => (
								<FriendCard key={friend.id} friend={friend} />
							))}
						</div>

						{hasMore && (
							<button
								className={styles.toggleButton}
								onClick={() => setExpanded((prev) => !prev)}
								aria-expanded={expanded}
								aria-controls="friends-grid"
							>
								<span
									className={`${styles.toggleIcon} ${expanded ? styles.open : ""}`}
									aria-hidden="true"
								>
									▼
								</span>
								{expanded ? "VER MENOS" : `VER ${hiddenCount} MÁS`}
							</button>
						)}
					</>
				)}
			</div>
		</section>
	);
}

// src/components/profile/FriendList.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import { Link } from "react-router-dom";
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
	return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function FriendCard({ friend }: { friend: FriendSummary }) {
	const level = getLevelFromXp(friend.totalXp ?? 0);

	return (
		<Link
			to={`/profile/${friend.id}`}
			className={styles.friendCard}
			aria-label={`Ver perfil de ${friend.username}, nivel ${level}`}
		>
			<span className={styles.name}>{friend.username}</span>
			<div className={styles.avatarWrapper}>
				{friend.avatar ? (
					<img src={friend.avatar} alt="" referrerPolicy="no-referrer" className={styles.avatarImg} />
				) : (
					<span className={styles.avatarInitials} aria-hidden="true">
						{getInitials(friend.username)}
					</span>
				)}
			</div>

			<span className={styles.level}>NV. {level}</span>
		</Link>
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
				AMIGOS <span className={styles.count}>({friends.length})</span>
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
							>
								{expanded ? "Ver menos" : `Ver ${hiddenCount} más`}
							</button>
						)}
					</>
				)}
			</div>
		</section>
	);
}

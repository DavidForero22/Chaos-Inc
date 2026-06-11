import { useState } from "react";
import { getFullAvatarUrl } from "../../utils/avatar";

export function LeaderboardAvatar({
	avatarUrl,
	username,
}: {
	avatarUrl: string | null;
	username: string;
}) {
	const [avatarError, setAvatarError] = useState(false);

	const fullSrc = getFullAvatarUrl(avatarUrl);
	const showAvatar = !!fullSrc && !avatarError;
	const initials = username.substring(0, 2).toUpperCase();

	return (
		<div className="w-14 h-14 rounded-sm overflow-hidden mx-4 border-2 border-gray-800 shrink-0 bg-white shadow-inner flex items-center justify-center">
			{showAvatar ? (
				<img
					src={fullSrc}
					alt=""
					className="w-full h-full object-cover"
					onError={() => setAvatarError(true)}
					referrerPolicy="no-referrer"
				/>
			) : (
				<span
					aria-hidden="true"
					className="text-3xl font-black text-gray-400 opacity-50"
				>
					{initials}
				</span>
			)}
		</div>
	);
}

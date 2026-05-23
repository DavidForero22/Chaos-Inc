export const getFullAvatarUrl = (path: string | null): string | null => {
	if (!path) return null;
	if (path.startsWith("http://") || path.startsWith("https://")) {
		return path;
	}
	const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
	return `${baseUrl}/storage/${path}`;
};

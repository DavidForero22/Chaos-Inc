import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";

export default function AdminGuard() {
	const role = useAuthStore((s) => s.role);
	const user = useAuthStore((s) => s.user);

	if (!user || role !== "admin") {
		return <Navigate to="/unauthorized" replace />;
	}

	return <Outlet />;
}

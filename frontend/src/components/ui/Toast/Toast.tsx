// src/components/ui/Toast.tsx
import {
	FaInfoCircle,
	FaCheckCircle,
	FaExclamationTriangle,
	FaTimesCircle,
	FaTimes,
} from "react-icons/fa";
import { createPortal } from "react-dom";
import { useToastStore } from "../../../store/useToastStore";
import styles from "./Toast.module.css";

export function Toast() {
	const { isVisible, message, type, hideToast } = useToastStore();

	if (typeof document === "undefined") return null;

	// --- ACCESIBILIDAD: Ocultar iconos a lectores de pantalla ---
	const icons = {
		info: <FaInfoCircle className="text-gray-500" aria-hidden="true" />,
		success: <FaCheckCircle className="text-green-600" aria-hidden="true" />,
		warn: (
			<FaExclamationTriangle className="text-yellow-600" aria-hidden="true" />
		),
		danger: <FaTimesCircle className="text-red-600" aria-hidden="true" />,
	};

	const bgColors = {
		info: "bg-gray-100 border-gray-400 text-gray-800",
		success: "bg-green-100 border-green-500 text-green-800",
		warn: "bg-yellow-100 border-yellow-500 text-yellow-800",
		danger: "bg-red-100 border-red-500 text-red-800",
	};

	// --- ACCESIBILIDAD: Roles dinámicos según severidad ---
	// Los errores/advertencias interrumpen (alert/assertive). La info es suave (status/polite).
	const isAlert = type === "danger" || type === "warn";
	const ariaRole = isAlert ? "alert" : "status";
	const ariaLive = isAlert ? "assertive" : "polite";

	return createPortal(
		<div
			className={`${styles.toastContainer} ${isVisible ? styles.show : styles.hide}`}
			// --- ACCESIBILIDAD: Ocultar todo el nodo al lector si no está activo ---
			aria-hidden={!isVisible}
		>
			<div
				className={`flex items-start gap-3 px-4 py-3 rounded shadow-xl border-l-4 min-w-70 max-w-sm ${bgColors[type]}`}
				role={ariaRole}
				aria-live={ariaLive}
				aria-atomic="true"
			>
				<div className="text-xl mt-0.5">{icons[type]}</div>
				<span className="flex-1 font-medium text-sm leading-tight">
					{message}
				</span>
				<button
					onClick={hideToast}
					className="text-black/40 hover:text-black/80 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-black/50 rounded"
					title="Cerrar notificación"
					// --- ACCESIBILIDAD: Prevenir el foco por Tab cuando está oculto ---
					tabIndex={isVisible ? 0 : -1}
					disabled={!isVisible}
					aria-label="Cerrar notificación"
				>
					<FaTimes aria-hidden="true" />
				</button>
			</div>
		</div>,
		document.body,
	);
}

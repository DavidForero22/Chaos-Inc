// src/components/ui/Toast.tsx
// Accesibilidad comprobada: SI

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

	// Íconos con accesibilidad básica
	const icons = {
		info: <FaInfoCircle aria-hidden="true" />,
		success: <FaCheckCircle aria-hidden="true" />,
		warn: <FaExclamationTriangle aria-hidden="true" />,
		danger: <FaTimesCircle aria-hidden="true" />,
	};

	// Colores de fondo (sin cambios funcionales)
	const bgColors = {
		info: "bg-gray-100 border-gray-400 text-gray-800",
		success: "bg-green-100 border-green-500 text-green-800",
		warn: "bg-yellow-100 border-yellow-500 text-yellow-800",
		danger: "bg-red-100 border-red-500 text-red-800",
	};

	// Roles y etiquetas según el tipo de notificación
	const getAriaLabel = () => {
		switch (type) {
			case "danger":
				return "Error: ";
			case "warn":
				return "Advertencia: ";
			case "success":
				return "Éxito: ";
			default:
				return "Información: ";
		}
	};

	const isAlert = type === "danger" || type === "warn";
	const ariaRole = isAlert ? "alert" : "status";
	const ariaLive = isAlert ? "assertive" : "polite";

	return createPortal(
		<div
			className={`${styles.toastContainer} ${isVisible ? styles.show : styles.hide}`}
			aria-hidden={!isVisible}
			aria-live="off" // El contenedor no anuncia, solo el contenido interno
		>
			<div
				className={`flex items-start gap-3 px-4 py-3 rounded shadow-xl border-l-4 min-w-70 max-w-sm ${bgColors[type]}`}
				role={ariaRole}
				aria-live={ariaLive}
				aria-atomic="true"
				aria-label={`${getAriaLabel()}${message}`}
			>
				{/* Ícono decorativo */}
				<div className="text-xl mt-0.5" aria-hidden="true">
					{icons[type]}
				</div>

				{/* Mensaje principal */}
				<span className="flex-1 font-medium text-sm leading-tight">
					{message}
				</span>

				{/* Botón de cerrar */}
				<button
					onClick={hideToast}
					className="text-black/40 hover:text-black/80 transition-colors p-1 rounded"
					title="Cerrar notificación"
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

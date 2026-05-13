// src/components/ui/Toast.tsx
import {
	FaInfoCircle,
	FaCheckCircle,
	FaExclamationTriangle,
	FaTimesCircle,
	FaTimes,
} from "react-icons/fa";
import { createPortal } from "react-dom";
import { useToastStore} from "../../../store/useToastStore"
import styles from "./Toast.module.css";

export function Toast() {
	const { isVisible, message, type, hideToast } = useToastStore();

	if (typeof document === "undefined") return null;

	const icons = {
		info: <FaInfoCircle className="text-gray-500" />,
		success: <FaCheckCircle className="text-green-600" />,
		warn: <FaExclamationTriangle className="text-yellow-600" />,
		danger: <FaTimesCircle className="text-red-600" />,
	};

	const bgColors = {
		info: "bg-gray-100 border-gray-400 text-gray-800",
		success: "bg-green-100 border-green-500 text-green-800",
		warn: "bg-yellow-100 border-yellow-500 text-yellow-800",
		danger: "bg-red-100 border-red-500 text-red-800",
	};

	return createPortal(
		<div
			className={`${styles.toastContainer} ${isVisible ? styles.show : styles.hide}`}
		>
			<div
				className={`flex items-start gap-3 px-4 py-3 rounded shadow-xl border-l-4 min-w-70 max-w-sm ${bgColors[type]}`}
			>
				<div className="text-xl mt-0.5">{icons[type]}</div>
				<span className="flex-1 font-medium text-sm leading-tight">
					{message}
				</span>
				<button
					onClick={hideToast}
					className="text-black/40 hover:text-black/80 transition-colors p-1"
					title="Cerrar notificación"
				>
					<FaTimes />
				</button>
			</div>
		</div>,
		document.body,
	);
}

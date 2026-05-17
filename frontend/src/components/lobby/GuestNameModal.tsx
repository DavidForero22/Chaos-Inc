// Accesibilidad comprobada: SI

import { useState } from "react";
import api, { getCsrfCookie } from "../../api/axios";
import { useAuthStore } from "../../store/useAuthStore";
import ModalLayout from "../ui/ModalLayout";
import styles from "../ui/ModalLayout.module.css";
import LoginModal from "../ui/AuthModal/LoginModal";
import RegisterModal from "../ui/AuthModal/RegisterModal";
import { DiscordIcon, GoogleIcon } from "../ui/AuthModal/AuthIcons";

interface GuestNameModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

type ViewState = "menu" | "guest_input" | "login" | "register";

export default function GuestNameModal({
	onClose,
	onSuccess,
}: GuestNameModalProps) {
	const { setAuth } = useAuthStore();
	const [view, setView] = useState<ViewState>("menu");
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleGuestSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		setError("");

		try {
			await getCsrfCookie();
			const res = await api.post("/guest-login", { username });

			setAuth(
				res.data.user.id,
				res.data.user.username,
				res.data.user.avatar,
				true,
				res.data.user.role,
			);

			onSuccess();
		} catch (err) {
			console.error(err);
			setError("Error al conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	const handleSocialLogin = (provider: "google" | "discord") => {
		const currentPath = encodeURIComponent(window.location.pathname);
		window.location.href = `${BACKEND_URL}/auth/${provider}/redirect?return_to=${currentPath}`;
	};

	if (view === "login") {
		return (
			<LoginModal
				onClose={() => setView("menu")}
				onSwitchToRegister={() => setView("register")}
				onSuccess={onSuccess}
				isGuestFlow={true}
			/>
		);
	}

	if (view === "register") {
		return (
			<RegisterModal
				onClose={() => setView("menu")}
				onSwitchToLogin={() => setView("login")}
				onSuccess={onSuccess}
				isGuestFlow={true}
			/>
		);
	}

	if (view === "guest_input") {
		return (
			<ModalLayout
				title="Chaos Inc."
				subtitle="Pase de Jugador Temporal"
				onClose={() => setView("menu")}
				onSubmit={handleGuestSubmit}
				isLoading={loading}
				submitText="Entrar a la Sala"
				loadingText="Autorizando..."
				disableBackdropClick={true}
			>
				<div className={styles.fieldRow}>
					<span className={styles.annexNum} aria-hidden="true">
						1.
					</span>
					<div className={styles.fieldWrap}>
						<label
							htmlFor="guest-username"
							className={`${styles.label} ${styles.labelFirst}`}
						>
							Nombre Temporal
						</label>
						<input
							id="guest-username"
							className={styles.input}
							type="text"
							placeholder="Ingresa tu nombre..."
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							aria-required="true"
							aria-describedby="guest-hint"
							autoFocus
							maxLength={15}
						/>
						<p id="guest-hint" className={styles.hint}>
							Los progresos no se guardarán al finalizar la jornada.
						</p>
					</div>
				</div>
				{error && (
					<p className={styles.error} role="alert" aria-live="polite">
						⚠ {error}
					</p>
				)}
			</ModalLayout>
		);
	}

	// Vista Principal del Menú
	return (
		<ModalLayout
			title="Chaos Inc."
			subtitle="Identificación Requerida"
			onClose={onClose}
			hideSubmit={true}
		>
			<p
				className={styles.hint}
				style={{ textAlign: "center", marginBottom: "2rem" }}
			>
				Para acceder a la sala, por favor seleccione un método de registro:
			</p>

			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				{/* ── BOTONES DE INICIO Y REGISTRO ── */}
				<div style={{ display: "flex", gap: "1rem", width: "100%" }}>
					<button
						type="button"
						onClick={() => setView("login")}
						aria-label="Iniciar sesión con cuenta existente"
						className="flex-1 px-4 py-3 bg-[#393e42] hover:bg-[#2a2d30] text-[#d2d4d1] font-bold uppercase text-sm transition-all rounded-sm text-center"
					>
						Iniciar Sesión
					</button>
					<button
						type="button"
						onClick={() => setView("register")}
						aria-label="Crear nueva cuenta"
						className="flex-1 px-4 py-3 bg-[#393e42] hover:bg-[#2a2d30] text-[#d2d4d1] font-bold uppercase text-sm transition-all rounded-sm text-center"
					>
						Crear Cuenta
					</button>
				</div>

				<div
					className={styles.socialDivider}
					role="separator"
					aria-label="o registrate con"
				>
					<div className={styles.socialDividerLine} aria-hidden="true" />
					<span className={styles.socialDividerText}>o registrate con </span>
					<div className={styles.socialDividerLine} aria-hidden="true" />
				</div>

				<div className={styles.socialButtons}>
					<button
						type="button"
						aria-label="Iniciar sesión con Google"
						className={`${styles.btnSocial} ${styles.btnGoogle}`}
						onClick={() => handleSocialLogin("google")}
					>
						<GoogleIcon aria-hidden="true" />
						Google
					</button>
					<button
						type="button"
						aria-label="Iniciar sesión con Discord"
						className={`${styles.btnSocial} ${styles.btnDiscord}`}
						onClick={() => handleSocialLogin("discord")}
					>
						<DiscordIcon aria-hidden="true" />
						Discord
					</button>
				</div>

				<div
					className={styles.socialDivider}
					role="separator"
					aria-label="o si lo prefieres"
				>
					<div className={styles.socialDividerLine} aria-hidden="true" />
					<span className={styles.socialDividerText}>o si lo prefieres</span>
					<div className={styles.socialDividerLine} aria-hidden="true" />
				</div>

				<button
					type="button"
					onClick={() => setView("guest_input")}
					aria-label="Entrar como invitado temporal sin crear cuenta"
					className="px-6 py-3 bg-transparent border-2 border-[#8f9e9b] text-[#8f9e9b] hover:border-[#393e42] hover:text-[#393e42] font-bold uppercase text-sm transition-all rounded-sm w-full"
				>
					Entrar como Invitado Temporal
				</button>
			</div>
		</ModalLayout>
	);
}

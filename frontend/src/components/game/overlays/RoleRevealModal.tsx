// src/components/game/RoleRevealModal.tsx

import { useState, useRef, useEffect } from "react";
import type { UIEvent } from "react";
import type { MyData } from "../../../types/live-game.ts";
import styles from "./RoleRevealModal.module.css";

type DisplayRole = MyData["role"];

const ROLE_CONFIG: Record<
	DisplayRole,
	{
		label: string;
		image: string;
		objective: string;
		titleLabel: string;
		isWarning?: boolean;
	}
> = {
	boss: {
		label: "Jefe",
		image: "/role_reveal_boss.jpeg",
		objective:
			"Eres el jefe de la empresa. Tu prioridad absoluta es mantener el control y despedir a los Sindicalistas encubiertos antes de que organicen un motín que te deje en la calle.",
		titleLabel: "Tu rol en esta partida",
	},
	secretary: {
		label: "Secretario",
		image: "/role_reveal_secretary.jpeg",
		objective:
			"Eres la mano derecha de Dirección. Filtra la información, desvía sospechas y protege el puesto del Jefe por encima de todo. Si la Dirección cae, tú también.",
		titleLabel: "Tu rol en esta partida",
	},
	intern: {
		label: "Becario",
		image: "/role_placeholder.png",
		objective:
			"Tu contrato no está remunerado y estás harto. Sobrevive al caos, elimina a la competencia directa y asciende en la cadena alimenticia hasta convertirte en el nuevo Jefe.",
		titleLabel: "Tu rol en esta partida",
	},
	union: {
		label: "Sindicalista",
		image: "/role_placeholder.png",
		objective:
			"El sistema está corrupto y tú eres la cura. Coordínate en secreto, expón las prácticas ilegales y acaba con la Dirección actual para tomar el control de la empresa.",
		titleLabel: "Tu rol en esta partida",
	},
};

interface RoleRevealModalProps {
	role: MyData["role"];
	onClose: () => void;
	isActingBoss?: boolean;
}

export function RoleRevealModal({ role, onClose }: RoleRevealModalProps) {
	const config = ROLE_CONFIG[role];

	// Refs y Estados para el scroll
	const scrollRef = useRef<HTMLDivElement>(null);
	const [showArrow, setShowArrow] = useState(true);

	// Vigila si el usuario llega al fondo de la pagina
	const handleScroll = (e: UIEvent<HTMLDivElement>) => {
		const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
		const isBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 80;
		setShowArrow(!isBottom);
	};

	// Comprobar al montarse si hace falta hacer scroll
	useEffect(() => {
		if (scrollRef.current) {
			const { scrollHeight, clientHeight } = scrollRef.current;
			// Si el contenido ya cabe en la pantalla, no mostrar la flecha
			if (scrollHeight <= clientHeight + 5) {
				setShowArrow(false);
			}
		}
	}, []);

	return (
		<div className={styles.modalOverlay}>
			<div className={styles.folderWrapper}>
				{/* ── TAPA DE LA CARPETA (Arriba en móvil, Izquierda en PC) ── */}
				<div className={styles.folderTab}>
					{/* El saliente de la carpeta */}
					<div className={styles.folderTabProtrusion} />

					{/* Texto vertical (Solo se ve en PC/Landscape) */}
					<div className="hidden md:flex h-full flex-col justify-end items-center pb-32 relative z-10">
						<span className="text-black/30 font-black text-4xl tracking-widest uppercase -rotate-90 whitespace-nowrap">
							Expediente
						</span>
					</div>
				</div>

				{/* ── HOJA DE PAPEL (Abajo en móvil, Derecha en PC) ── */}
				<div
					className={styles.paperSheet}
					ref={scrollRef}
					onScroll={handleScroll}
				>
					<div className={styles.redMargin} />
					{/* Marca de agua */}
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 text-5xl md:text-8xl lg:text-[10rem] font-black text-red-600 opacity-[0.03] pointer-events-none uppercase tracking-widest whitespace-nowrap z-0">
						TOP SECRET
					</div>
					{/* Contenido scrolleable */}
					<div className="relative z-10 px-8 md:pl-20 md:pr-10 py-8 flex flex-col h-full">
						<div className="shrink-0 mb-4 text-center">
							<p
								className={`text-sm md:text-base uppercase font-bold tracking-widest mb-1 inline-block border-b-2 border-dashed border-[#393e42]/30 ${config.isWarning ? "text-red-600 bg-red-200 px-2" : "text-[#393e42]"}`}
							>
								{config.titleLabel}
							</p>
						</div>

						{/* La Foto Adjunta */}
						<div className="shrink-0 w-full mb-6 flex justify-center">
							<div className="bg-[#f8f9f8] p-2 md:p-4 pb-6 md:pb-12 shadow-lg border border-gray-300 rotate-1 w-full max-w-125 relative">
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-5 md:w-16 md:h-6 bg-white/40 backdrop-blur-sm rotate-3 shadow-sm border border-white/20" />

								<div className="aspect-video w-full bg-gray-300 overflow-hidden relative border border-gray-400">
									<img
										src={config.image}
										alt={config.label}
										className="w-full h-full object-cover"
										onError={(e) => {
											e.currentTarget.style.display = "none";
										}}
									/>
									<div className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-bold text-gray-500 opacity-50 -z-10 uppercase tracking-widest">
										[FOTO_ADJUNTA.JPG]
									</div>
								</div>
							</div>
						</div>

						{/* Texto del objetivo */}
						<div className="grow">
							<p className="text-xs uppercase font-bold mb-1 opacity-70">
								Directiva Operativa:
							</p>
							<p className="text-[#393e42] font-bold text-sm md:text-base lg:text-lg leading-relaxed md:leading-8">
								{config.objective}
							</p>
						</div>

						{/* Botón de acción */}
						<div className="mt-6 flex justify-center shrink-0">
							<button
								onClick={onClose}
								className="w-full md:max-w-75 px-8 py-3 mb-8 border-[3px] border-[#295c60] text-[#295c60] font-black uppercase tracking-widest hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors bg-transparent"
							>
								Entendido
							</button>
						</div>
					</div>
				</div>

				{/* FLECHA DE GARABATO */}
				<div
					className={`${styles.doodleArrow} ${showArrow ? styles.visible : styles.hidden}`}
				>
					{/* Flecha parecido a dibujo */}
					<svg
						viewBox="0 0 40 100"
						fill="none"
						stroke="#1e3a8a"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="w-8 h-20 opacity-60"
					>
						<path d="M20 10 Q 22 40, 18 80 M 8 65 Q 18 80, 20 85 Q 22 80, 32 65" />
					</svg>
				</div>
			</div>
		</div>
	);
}
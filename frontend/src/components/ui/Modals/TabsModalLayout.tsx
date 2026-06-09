import type { ReactNode } from "react";
import AnimatedOverlay from "../../../layouts/site-overlay/AnimatedOverlay.tsx";
import { useModalOverlay } from "../../../hooks/ui/useModalOverlay.ts";
import styles from "./TabsModalLayout.module.css";

export interface TabDefinition {
	id: string;
	label: string;
}

interface TabsModalLayoutProps {
	title: string;
	subtitle: string;
	tabs: TabDefinition[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
	onClose: () => void;
	onSubmit: (e: React.FormEvent) => void;
	isLoading?: boolean;
	submitText?: string;
	loadingText?: string;
	children: ReactNode;
	disableBackdropClick?: boolean;
}

export default function TabsModalLayout({
	title,
	subtitle,
	tabs,
	activeTab,
	onTabChange,
	onClose,
	onSubmit,
	isLoading = false,
	submitText = "Guardar cambios",
	loadingText = "Procesando...",
	children,
	disableBackdropClick = false,
}: TabsModalLayoutProps) {
	const { isClosing, closeAnimated, handleBackdropClick } = useModalOverlay(
		onClose,
		disableBackdropClick,
	);

	return (
		<AnimatedOverlay
			isClosing={isClosing}
			onBackdropClick={handleBackdropClick}
			ariaLabelledby="modal-title"
			ariaDescribedby="modal-description"
		>
			<div className={styles.card}>
				{/* ── CABECERA ── */}
				<div className={`${styles.header} shrink-0`}>
					<div>
						<p className={styles.headerTitle}>
							<span id="modal-title" className={styles.headerTitleText}>
								{title}
							</span>
							<span id="modal-description" className={styles.headerSub}>
								{subtitle}
							</span>
						</p>
					</div>
					<button
						type="button"
						className={styles.closeBtn}
						onClick={closeAnimated}
						title="Cerrar"
						aria-label="Cerrar modal"
					>
						✕
					</button>
				</div>

				{/* ── BARRA DE PESTAÑAS ── */}
				<div className={`${styles.tabsContainer} shrink-0`}>
					<div className={styles.tabList} role="tablist">
						{tabs.map((tab) => {
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									type="button"
									role="tab"
									aria-selected={isActive}
									aria-controls={`panel-${tab.id}`}
									id={`tab-${tab.id}`}
									className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ""}`}
									onClick={() => onTabChange(tab.id)}
								>
									{tab.label}
								</button>
							);
						})}
					</div>
				</div>

				{/* ── FORMULARIO GLOBAL (Corregido para Scroll) ── */}
				<form
					className={`${styles.formWrapper} flex flex-col flex-1 min-h-0 overflow-hidden`}
					onSubmit={onSubmit}
					aria-label={title}
				>
					{/* El contenido cambia según el activeTab */}
					<div
						className={`${styles.body} flex-1 overflow-y-auto min-h-0`}
						role="tabpanel"
						id={`panel-${activeTab}`}
						aria-labelledby={`tab-${activeTab}`}
					>
						{children}
					</div>

					{/* ── FOOTER Y ACCIONES ── */}
					<div className={`${styles.footer} shrink-0`}>
						<div />
						<div className={styles.actions}>
							<button
								type="button"
								className={styles.btnSecondary}
								onClick={closeAnimated}
								disabled={isLoading}
							>
								Cancelar
							</button>
							<button
								type="submit"
								className={styles.btnPrimary}
								disabled={isLoading}
							>
								{isLoading ? loadingText : submitText}
							</button>
						</div>
					</div>
				</form>
			</div>
		</AnimatedOverlay>
	);
}

import { useState, useEffect } from "react";

import GalleryGrid from "./GalleryGrid";
import GalleryDetail from "./GalleryDetail";
import styles from "./GalleryModal.module.css";
import { useModalOverlay } from "../../../../hooks/ui/useModalOverlay.ts";
import AnimatedOverlay from "../../../../layouts/site-overlay/AnimatedOverlay.tsx";
import { useGalleryData } from "../../../../hooks/profile/useGalleryData.ts";
import type {
	EnrichedCard,
	EnrichedEnding,
	EnrichedRole,
} from "../../../../types/gallery.ts";

type TabId = "cards" | "roles" | "endings";

interface GalleryModalProps {
	onClose: () => void;
}

export default function GalleryModal({ onClose }: GalleryModalProps) {
	const { cards, roles, endings, loading, error } = useGalleryData();
	const [activeTab, setActiveTab] = useState<TabId>("cards");
	const [selectedItemId, setSelectedItemId] = useState<string | number | null>(
		null,
	);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [mobileView, setMobileView] = useState<"grid" | "detail">("grid");

	const { isClosing, closeAnimated, handleBackdropClick } =
		useModalOverlay(onClose);

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("resize", handleResize);
		window.addEventListener("keydown", handleKeyDown);
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "unset";
		};
	}, [onClose]);

	const handleItemClick = (id: string | number) => {
		setSelectedItemId(id);
		if (isMobile) setMobileView("detail");
	};

	const handleBackToGrid = () => {
		setMobileView("grid");
		setSelectedItemId(null);
	};

	const getItemById = (
		tab: TabId,
		id: string | number,
	): EnrichedCard | EnrichedRole | EnrichedEnding | undefined => {
		if (tab === "cards") return cards.find((c) => c.id === id);
		if (tab === "roles") return roles.find((r) => r.role === id);
		return endings.find((e) => e.ending === id);
	};

	const selectedItem = selectedItemId
		? getItemById(activeTab, selectedItemId)
		: undefined;

	return (
		<AnimatedOverlay
			isClosing={isClosing}
			onBackdropClick={handleBackdropClick}
			ariaLabelledby="gallery-title"
		>
			<div className={styles.bookWrapper}>
				{/* Pestañas superiores */}
				<div className={styles.bookmarks}>
					{(["cards", "roles", "endings"] as TabId[]).map((tab) => (
						<button
							key={tab}
							className={`${styles.bookmark} ${activeTab === tab ? styles.activeBookmark : ""}`}
							onClick={() => {
								setActiveTab(tab);
								setSelectedItemId(null);
								if (isMobile) setMobileView("grid");
							}}
							disabled={loading} /* Prevenir clics en pestañas mientras carga */
						>
							{tab === "cards"
								? "Cartas"
								: tab === "roles"
									? "Roles"
									: "Finales"}
						</button>
					))}
				</div>

				<div className={styles.bookInner}>
					{/* BOTÓN DE CIERRE (X) */}
					<button
						onClick={closeAnimated}
						className={styles.closeAlbumBtn}
						aria-label="Cerrar Álbum"
					>
						✕
					</button>

					<h2 id="gallery-title" className="sr-only">
						Álbum de desbloqueables
					</h2>

					{/* OVERLAY DE CARGA / ERROR  */}
					{(loading || error) && (
						<div className={styles.loadingOverlay}>
							{loading ? (
								<div className={styles.statusBox}>
									<div className={styles.spinner}></div>
									<p>Desempolvando álbum...</p>
								</div>
							) : (
								<div className={styles.statusBox}>
									<p className={styles.errorText}>Error: {error}</p>
									<button
										onClick={closeAnimated}
										className={styles.closeBtnTemp}
									>
										Cerrar Álbum
									</button>
								</div>
							)}
						</div>
					)}

					{/* CONTENIDO DEL LIBRO */}
					<div
						className={`${styles.contentWrapper} ${loading || error ? styles.dimmed : ""}`}
					>
						{!isMobile ? (
							<div className={styles.desktopLayout}>
								<div className={styles.leftPage}>
									<div className={styles.pageContent}>
										<GalleryGrid
											activeTab={activeTab}
											cards={cards}
											roles={roles}
											endings={endings}
											selectedItemId={selectedItemId}
											onItemClick={handleItemClick}
										/>
									</div>
								</div>
								<div className={styles.spine}></div>
								<div className={styles.rightPage}>
									<div className={styles.pageContent}>
										<GalleryDetail
											selectedItem={selectedItem}
											isMobile={isMobile}
											onBack={handleBackToGrid}
										/>
									</div>
								</div>
							</div>
						) : (
							<div className={styles.mobileLayout}>
								<div className={styles.pageContent}>
									{mobileView === "grid" ? (
										<GalleryGrid
											activeTab={activeTab}
											cards={cards}
											roles={roles}
											endings={endings}
											selectedItemId={selectedItemId}
											onItemClick={handleItemClick}
										/>
									) : (
										<GalleryDetail
											selectedItem={selectedItem}
											isMobile={isMobile}
											onBack={handleBackToGrid}
										/>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</AnimatedOverlay>
	);
}

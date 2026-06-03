// src/components/profile/gallery/GalleryViewerModal.tsx

import { useState } from "react";
import AnimatedOverlay from "../../../../layouts/site-overlay/AnimatedOverlay.tsx";
import { useModalOverlay } from "../../../../hooks/ui/useModalOverlay.ts";
import type { ViewerItem } from "../../../../hooks/profile/useGalleryViewer.ts";
import type {
	EnrichedEnding,
	EnrichedExtra,
	EnrichedRole,
} from "../../../../types/gallery.ts";
import styles from "./GalleryViewerModal.module.css";

interface GalleryViewerModalProps {
	item: ViewerItem;
	onClose: () => void;
}

function isEnrichedRole(item: ViewerItem): item is EnrichedRole {
	return (item as EnrichedRole).role !== undefined;
}

function isEnrichedEnding(item: ViewerItem): item is EnrichedEnding {
	return (item as EnrichedEnding).ending !== undefined;
}

function isEnrichedExtra(item: ViewerItem): item is EnrichedExtra {
	return (item as EnrichedExtra).achievements_required !== undefined;
}

export default function GalleryViewerModal({
	item,
	onClose,
}: GalleryViewerModalProps) {
	const [currentPage, setCurrentPage] = useState(0);

	const { isClosing, closeAnimated, handleBackdropClick } =
		useModalOverlay(onClose);

	// Determinar qué mostrar
	let images: string[] | null = null;
	let singleImage: string | null = null;
	let title: string = "";

	if (isEnrichedRole(item)) {
		title = item.label;
		singleImage = item.image;
	} else if (isEnrichedEnding(item)) {
		title = item.name;
		singleImage = item.image;
	} else if (isEnrichedExtra(item)) {
		title = item.name;
		if (item.images && item.images.length > 0) {
			images = item.images;
		} else if (item.image) {
			singleImage = item.image;
		}
	}

	const isMultiPage = images !== null && images.length > 1;
	const totalPages = images?.length ?? 0;

	const goToPrev = () => setCurrentPage((p) => Math.max(0, p - 1));
	const goToNext = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

	// Interceptar el backdrop click del VIEWER sin que burbujee al GalleryModal
	const handleViewerBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		handleBackdropClick(e);
	};

	return (
		<AnimatedOverlay
			isClosing={isClosing}
			onBackdropClick={handleViewerBackdropClick}
			ariaLabelledby="viewer-title"
		>
			<div
				className={styles.viewerWrapper}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Título */}
				<h2 id="viewer-title" className={styles.viewerTitle}>
					{title}
				</h2>

				{/* Botón cerrar */}
				<button
					className={styles.closeBtn}
					onClick={closeAnimated}
					aria-label="Cerrar visor"
				>
					✕
				</button>

				{/* Contenido */}
				<div className={styles.imageArea}>
					{images ? (
						// Modo documento paginado
						<>
							<img
								src={images[currentPage]}
								alt={`${title} — página ${currentPage + 1} de ${totalPages}`}
								className={styles.viewerImage}
							/>
							{isMultiPage && (
								<div className={styles.pageControls}>
									<button
										onClick={goToPrev}
										disabled={currentPage === 0}
										aria-label="Página anterior"
										className={styles.pageBtn}
									>
										←
									</button>
									<span className={styles.pageCounter}>
										{currentPage + 1} / {totalPages}
									</span>
									<button
										onClick={goToNext}
										disabled={currentPage === totalPages - 1}
										aria-label="Página siguiente"
										className={styles.pageBtn}
									>
										→
									</button>
								</div>
							)}
						</>
					) : singleImage ? (
						<img src={singleImage} alt={title} className={styles.viewerImage} />
					) : (
						<div className={styles.noImage}>Sin imagen disponible</div>
					)}
				</div>
			</div>
		</AnimatedOverlay>
	);
}

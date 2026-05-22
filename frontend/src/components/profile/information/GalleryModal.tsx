// src/components/profile/gallery/GalleryModal.tsx

import { useState, useEffect } from "react";
import ModalLayout from "../../ui/ModalLayout";
import {
	useGalleryData,
	type EnrichedCard,
	type EnrichedRole,
	type EnrichedEnding,
} from "../../../hooks/profile/useGalleryData.ts";
import styles from "./GalleryModal.module.css";

type TabId = "cards" | "roles" | "endings";

interface GalleryModalProps {
	onClose: () => void;
}

// Type guards para identificar cada tipo
function isEnrichedCard(
	item: EnrichedCard | EnrichedRole | EnrichedEnding,
): item is EnrichedCard {
	return (item as EnrichedCard).is_discovered !== undefined;
}

function isEnrichedRole(
	item: EnrichedCard | EnrichedRole | EnrichedEnding,
): item is EnrichedRole {
	return (item as EnrichedRole).role !== undefined;
}

function isEnrichedEnding(
	item: EnrichedCard | EnrichedRole | EnrichedEnding,
): item is EnrichedEnding {
	return (item as EnrichedEnding).ending !== undefined;
}

export default function GalleryModal({ onClose }: GalleryModalProps) {
	const { cards, roles, endings, loading, error } = useGalleryData();
	const [activeTab, setActiveTab] = useState<TabId>("cards");
	const [selectedItemId, setSelectedItemId] = useState<string | number | null>(
		null,
	);
	const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
	const [mobileView, setMobileView] = useState<"grid" | "detail">("grid");

	// Detectar cambios de tamaño de pantalla
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < 768);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleItemClick = (id: string | number) => {
		if (isMobile) {
			setSelectedItemId(id);
			setMobileView("detail");
		} else {
			setSelectedItemId(id);
		}
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

	// Renderizado del grid izquierdo
	const renderGrid = () => {
		let items: (EnrichedCard | EnrichedRole | EnrichedEnding)[] = [];
		if (activeTab === "cards") items = cards;
		else if (activeTab === "roles") items = roles;
		else items = endings;

		return (
			<div className={styles.grid}>
				{items.map((item) => {
					// Obtener ID según el tipo
					let id: string | number;
					let isUnlocked: boolean;
					let displayName: string;
					let imageUrl: string | null | undefined;

					if (isEnrichedCard(item)) {
						id = item.id;
						isUnlocked = item.is_discovered;
						displayName = item.display_name;
						imageUrl = item.image;
					} else if (isEnrichedRole(item)) {
						id = item.role;
						isUnlocked = item.isUnlocked;
						displayName = item.label;
						imageUrl = item.image;
					} else {
						id = item.ending;
						isUnlocked = item.isUnlocked;
						displayName = item.name;
						imageUrl = item.image;
					}

					return (
						<div
							key={id}
							className={`${styles.gridItem} ${!isUnlocked ? styles.locked : ""}`}
							onClick={() => handleItemClick(id)}
						>
							<div className={styles.itemImage}>
								{isUnlocked && imageUrl ? (
									<img src={imageUrl} alt={displayName} />
								) : (
									<div className={styles.placeholder}>?</div>
								)}
							</div>
							<div className={styles.itemName}>
								{isUnlocked ? displayName : "???"}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	// Renderizado del detalle derecho
	const renderDetail = () => {
		if (!selectedItem) {
			return <div className={styles.emptyDetail}>Selecciona un elemento</div>;
		}

		// Variables comunes
		let isUnlocked: boolean;
		let name: string;
		let imageUrl: string | null | undefined;
		let unlockHint: string | undefined;

		// Variables específicas por tipo
		let description: string | null | undefined;
		let lore: string | null | undefined;
		let timesPlayed: number | undefined;

		if (isEnrichedCard(selectedItem)) {
			isUnlocked = selectedItem.is_discovered;
			name = selectedItem.display_name;
			imageUrl = selectedItem.image;
			unlockHint = selectedItem.unlockHint;
			description = selectedItem.description;
			lore = selectedItem.lore;
			timesPlayed = selectedItem.times_played;
		} else if (isEnrichedRole(selectedItem)) {
			isUnlocked = selectedItem.isUnlocked;
			name = selectedItem.label;
			imageUrl = selectedItem.image;
			unlockHint = selectedItem.unlockHint;
		} else {
			isUnlocked = selectedItem.isUnlocked;
			name = selectedItem.name;
			imageUrl = selectedItem.image;
			unlockHint = selectedItem.unlockHint;
		}

		return (
			<div className={styles.detail}>
				{isMobile && (
					<button onClick={handleBackToGrid} className={styles.backButton}>
						← Volver
					</button>
				)}
				<div className={styles.detailImage}>
					{isUnlocked && imageUrl ? (
						<img src={imageUrl} alt={name} />
					) : (
						<div className={styles.placeholderLarge}>?</div>
					)}
				</div>
				<h3 className={styles.detailTitle}>{isUnlocked ? name : "???"}</h3>
				{!isUnlocked && (
					<p className={styles.unlockHint}>
						{unlockHint || "Juega partidas para descubrirlo."}
					</p>
				)}
				{isUnlocked && isEnrichedCard(selectedItem) && (
					<>
						<p className={styles.detailDescription}>{description}</p>
						<p className={styles.detailLore}>{lore}</p>
						<p className={styles.timesPlayed}>Usada {timesPlayed} veces</p>
					</>
				)}
				{isUnlocked && isEnrichedRole(selectedItem) && (
					<p className={styles.detailDescription}>Rol desbloqueado.</p>
				)}
				{isUnlocked && isEnrichedEnding(selectedItem) && (
					<p className={styles.detailDescription}>Final desbloqueado.</p>
				)}
			</div>
		);
	};

	if (loading) {
		return (
			<ModalLayout
				title="Galería"
				subtitle="Cargando contenido..."
				onClose={onClose}
			>
				<div className={styles.loading}>Cargando galería...</div>
			</ModalLayout>
		);
	}

	if (error) {
		return (
			<ModalLayout title="Galería" subtitle="Error al cargar" onClose={onClose}>
				<div className={styles.error}>Error: {error}</div>
			</ModalLayout>
		);
	}

	return (
		<ModalLayout
			title="Álbum de desbloqueables"
			subtitle="Descubre cartas, roles y finales"
			onClose={onClose}
		>
			<div className={styles.album}>
				{/* Pestañas superiores */}
				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${activeTab === "cards" ? styles.activeTab : ""}`}
						onClick={() => {
							setActiveTab("cards");
							setSelectedItemId(null);
							if (isMobile) setMobileView("grid");
						}}
					>
						Cartas
					</button>
					<button
						className={`${styles.tab} ${activeTab === "roles" ? styles.activeTab : ""}`}
						onClick={() => {
							setActiveTab("roles");
							setSelectedItemId(null);
							if (isMobile) setMobileView("grid");
						}}
					>
						Roles
					</button>
					<button
						className={`${styles.tab} ${activeTab === "endings" ? styles.activeTab : ""}`}
						onClick={() => {
							setActiveTab("endings");
							setSelectedItemId(null);
							if (isMobile) setMobileView("grid");
						}}
					>
						Fin de Partida
					</button>
				</div>

				<div className={styles.content}>
					{!isMobile && (
						<>
							<div className={styles.leftPage}>{renderGrid()}</div>
							<div className={styles.rightPage}>{renderDetail()}</div>
						</>
					)}
					{isMobile && mobileView === "grid" && renderGrid()}
					{isMobile && mobileView === "detail" && renderDetail()}
				</div>
			</div>
		</ModalLayout>
	);
}

// src/hooks/profile/useGalleryViewer.ts

import { useState } from "react";
import type {
	EnrichedEnding,
	EnrichedExtra,
	EnrichedRole,
} from "../../types/gallery";

export type ViewerItem = EnrichedRole | EnrichedEnding | EnrichedExtra;

export function useGalleryViewer() {
	const [viewerItem, setViewerItem] = useState<ViewerItem | null>(null);

	const openViewer = (item: ViewerItem) => {
		setViewerItem(item);
	};

	const closeViewer = () => {
		setViewerItem(null);
	};

	const isViewerOpen = viewerItem !== null;

	return { viewerItem, isViewerOpen, openViewer, closeViewer };
}

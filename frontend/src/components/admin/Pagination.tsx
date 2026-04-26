// src/components/admin/Pagination.tsx

interface Props {
	page: number;
	totalPages: number;
	pageSize: number;
	filteredCount: number;
	totalCount: number;
	onGoTo: (p: number) => void;
}

export default function Pagination({
	page,
	totalPages,
	pageSize,
	filteredCount,
	totalCount,
	onGoTo,
}: Props) {
	const shownCount = Math.min(pageSize, filteredCount - (page - 1) * pageSize);

	return (
		<div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-gray-400/50 mt-1">
			<div className="flex gap-1 items-center">
				<button
					onClick={() => onGoTo(1)}
					disabled={page === 1}
					className="px-2 py-1 border border-gray-400 text-xs font-bold uppercase disabled:opacity-30 hover:border-[#295c60] hover:text-[#295c60] disabled:hover:border-gray-400 disabled:hover:text-inherit transition-colors"
					title="Primera página"
				>
					«
				</button>
				<button
					onClick={() => onGoTo(page - 1)}
					disabled={page === 1}
					className="px-2 py-1 border border-gray-400 text-xs font-bold uppercase disabled:opacity-30 hover:border-[#295c60] hover:text-[#295c60] disabled:hover:border-gray-400 disabled:hover:text-inherit transition-colors"
					title="Página anterior"
				>
					‹
				</button>

				<span className="px-3 py-1 border-2 border-[#295c60] text-[#295c60] text-xs font-bold uppercase bg-[#295c60]/10 min-w-10 text-center">
					{page}
				</span>
				<span className="text-xs opacity-40 font-bold uppercase px-1">
					/ {totalPages}
				</span>

				<button
					onClick={() => onGoTo(page + 1)}
					disabled={page === totalPages}
					className="px-2 py-1 border border-gray-400 text-xs font-bold uppercase disabled:opacity-30 hover:border-[#295c60] hover:text-[#295c60] disabled:hover:border-gray-400 disabled:hover:text-inherit transition-colors"
					title="Página siguiente"
				>
					›
				</button>
				<button
					onClick={() => onGoTo(totalPages)}
					disabled={page === totalPages}
					className="px-2 py-1 border border-gray-400 text-xs font-bold uppercase disabled:opacity-30 hover:border-[#295c60] hover:text-[#295c60] disabled:hover:border-gray-400 disabled:hover:text-inherit transition-colors"
					title="Última página"
				>
					»
				</button>
			</div>

			<span className="text-xs font-bold uppercase opacity-50 tracking-wide">
				Mostrando{" "}
				<span className="text-[#295c60] opacity-100">{shownCount}</span> de{" "}
				<span className="text-[#295c60] opacity-100">{filteredCount}</span>{" "}
				{filteredCount !== totalCount && (
					<span className="opacity-70">(filtrado de {totalCount})</span>
				)}
			</span>
		</div>
	);
}

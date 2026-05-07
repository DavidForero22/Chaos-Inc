import { Modal } from "../ui/GameModal.tsx";

interface ActingBossModalProps {
	onClose: () => void;
}

export function ActingBossModal({ onClose }: ActingBossModalProps) {
	return (
		<Modal maxWidth="max-w-md">
			<div className="flex flex-col gap-4 text-center">
				<h2 className="text-2xl font-black text-amber-400">¡Jefe heredado!</h2>
				<p className="text-sm text-gray-200">
					El jefe anterior se ha desconectado. Has heredado el cargo de jefe de
					forma temporal hasta que vuelva a conectarse.
				</p>

				<div className="mt-2 flex justify-center">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded-md bg-amber-400 text-black font-black hover:bg-amber-300"
					>
						ENTENDIDO
					</button>
				</div>
			</div>
		</Modal>
	);
}

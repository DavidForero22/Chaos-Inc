// frontend/src/components/game/player/PlayerActions.tsx
import { usePlayerActions } from "../../../hooks/game/usePlayerActions.ts";

export function PlayerActions() {
    const actionLogic = usePlayerActions();

    // Si los datos no han cargado, no renderizamos nada
    if (!actionLogic.isReady) return null;

    const {
        me,
        isDiscardMode,
        currentCardsCount,
        projectedCardsCount,
        willBeOverLimit,
        isOverLimit,
        canEndTurn,
        canDiscard,
        isConfirmDisabled,
        hasPendingMultiAttack,
        handleConfirmDiscard,
        reactToAttack,
        reactToMultiAttack,
        endTurn,
        setIsDiscardMode,
        clearDiscardSelection,
    } = actionLogic;

    return (
        <div className="ml-auto flex flex-col items-end gap-2 shrink-0">
            {/* Contador de Cartas */}
            <div
                className={`text-sm font-mono font-bold px-2 py-1 rounded ${
                    isDiscardMode
                        ? willBeOverLimit
                            ? "bg-red-900/50 text-red-400 border border-red-700"
                            : "bg-green-900/50 text-green-400 border border-green-700"
                        : isOverLimit
                            ? "bg-red-900/50 text-red-400 border border-red-700"
                            : "bg-gray-700 text-gray-300"
                }`}
            >
                Cartas: {isDiscardMode ? projectedCardsCount : currentCardsCount} / {me!.max_hand_size}
            </div>

            {/* Botones de Reacción Defensiva */}
            {me!.combat_state.is_defending_single ? (
                <button
                    onClick={() => reactToAttack("accept")}
                    className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
                >
                    Asumir daño
                </button>
            ) : hasPendingMultiAttack ? (
                <button
                    onClick={() => reactToMultiAttack("accept")}
                    className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
                >
                    Asumir daño
                </button>
            ) : (
                <div className="flex flex-col gap-2 items-end">
                    
                    {/* Botones Modo Descarte */}
                    {isDiscardMode && !me!.conditions.must_discard ? (
                        <button
                            onClick={clearDiscardSelection}
                            className="px-4 py-2 rounded font-bold text-sm transition bg-orange-600 hover:bg-orange-500 text-white"
                        >
                            Cancelar
                        </button>
                    ) : !isDiscardMode ? (
                        <button
                            onClick={() => setIsDiscardMode(true)}
                            disabled={!canDiscard}
                            className={`px-4 py-2 rounded font-bold text-sm transition ${
                                canDiscard
                                    ? "bg-orange-600 hover:bg-orange-500 text-white"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            Descartar
                        </button>
                    ) : null}

                    {/* Botón Principal (Confirmar Descarte o Terminar Turno) */}
                    {isDiscardMode ? (
                        <button
                            onClick={handleConfirmDiscard}
                            disabled={isConfirmDisabled}
                            className={`px-4 py-2 rounded font-bold text-sm transition ${
                                !isConfirmDisabled
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                        >
                            {isConfirmDisabled ? "Descartando..." : "Confirmar Descarte"}
                        </button>
                    ) : (
                        <button
                            onClick={endTurn}
                            disabled={!canEndTurn}
                            className={`px-4 py-2 rounded font-bold text-sm transition ${
                                canEndTurn
                                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                            }`}
                            title={isOverLimit ? "Debes descartar cartas antes de terminar tu turno" : "Terminar turno"}
                        >
                            Terminar turno
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
// src/components/game/RoleRevealModal.tsx

import type { MyData } from "../../../types/live-game.ts";

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
    }
};

interface RoleRevealModalProps {
    role: MyData["role"];
    onClose: () => void;
    isActingBoss?: boolean;
}

export function RoleRevealModal({
    role,
    onClose,
}: RoleRevealModalProps) {
    const config = ROLE_CONFIG[role];

    return (
        <div className="fixed inset-0 z-50 bg-[#393e42]/90 backdrop-blur-sm overflow-hidden flex items-center">
            
            {/* Contenedor pegado a la izquierda animado */}
            <div className="absolute left-0 top-0 bottom-0 flex items-center animate-folder-in">
                
                {/* ── TAPA DE LA CARPETA (Izquierda) ── */}
                <div className="relative w-16 md:w-40 lg:w-64 xl:w-60 h-[95vh] max-h-225 bg-[#c19a6b] rounded-r-2xl border-y border-r border-black/30 shadow-[15px_0_30px_rgba(0,0,0,0.6)] z-20 shrink-0">
                    
                    {/* Textura sutil de cartón */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cardboard.png')]" />
                    
                    {/* Lomo interno */}
                    <div className="absolute inset-y-0 left-0 w-2 md:w-4 bg-black/20" /> 
                    
                    {/* Pestaña superior */}
                    <div className="absolute top-16 -right-3 md:-right-4 w-3 md:w-4 h-32 md:h-40 bg-[#c19a6b] rounded-r-lg border-y border-r border-black/20 shadow-[5px_0_10px_rgba(0,0,0,0.2)]" />

                    {/* Texto vertical (tamaño original) */}
                    <div className="hidden md:flex h-full flex-col justify-end items-center pb-32 relative z-10">
                         <span className="text-black/30 font-black text-4xl tracking-widest uppercase -rotate-90 whitespace-nowrap">
                             Expediente
                         </span>
                    </div>
                </div>

                {/* ── HOJA DE PAPEL (Derecha) ── */}
                {/* AUMENTADO: w-[90vw] md:w-[80vw] max-w-[900px] */}
                <div 
                    className="relative h-[85vh] max-h-200 w-[90vw] md:w-[80vw] max-w-192.5 bg-[#d2d4d1] z-10 shadow-xl flex flex-col font-mono text-[#393e42] border-y border-r border-[#393e42]/40 -ml-2"
                    style={{
                        backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, rgba(146, 158, 156, 0.35) 31px, rgba(146, 158, 156, 0.35) 32px)",
                        lineHeight: "32px"
                    }}
                >
                    {/* Margen rojo */}
                    <div className="absolute top-0 bottom-0 left-7.5 md:left-12.5 w-0.5 bg-[rgba(220,50,50,0.2)] pointer-events-none" />

                    {/* Marca de agua */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 text-6xl md:text-8xl lg:text-[10rem] font-black text-red-600 opacity-[0.03] pointer-events-none uppercase tracking-widest whitespace-nowrap z-0">
                        TOP SECRET
                    </div>

                    <div className="relative z-10 pl-12.5 md:pl-20 pr-6 md:pr-10 py-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
                        
                        <div className="shrink-0 mb-4 text-center">
                            <p className={`text-sm uppercase font-bold tracking-widest mb-1 inline-block border-b-2 border-dashed border-[#393e42]/30 ${config.isWarning ? "text-red-600 bg-red-200 px-2" : "text-[#393e42]"}`}>
                                {config.titleLabel}
                            </p>
                        </div>

                        {/* AUMENTADO: max-w-[750px] para que la foto se vea enorme */}
                        <div className="shrink-0 w-full mb-8 flex justify-center">
                            <div className="bg-[#f8f9f8] p-3 md:p-4 pb-8 md:pb-12 shadow-lg border border-gray-300 rotate-1 w-full max-w-187.5 relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm rotate-3 shadow-sm border border-white/20" />
                                
                                <div className="aspect-video w-full bg-gray-300 overflow-hidden relative border border-gray-400">
                                    <img 
                                        src={config.image} 
                                        alt={config.label}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-500 opacity-50 -z-10 uppercase tracking-widest">
                                        [FOTO_ADJUNTA.JPG]
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grow">
                            <p className="text-xs uppercase font-bold mb-1 opacity-70">
                                Directiva Operativa:
                            </p>
                            <p className="text-[#393e42] font-bold text-sm md:text-base lg:text-lg leading-8">
                                {config.objective}
                            </p>
                        </div>

                        <div className="mt-8 flex justify-center shrink-0">
                            <button
                                onClick={onClose}
                                className="w-full max-w-75 px-8 py-3 border-[3px] border-[#295c60] text-[#295c60] font-black uppercase tracking-widest hover:bg-[#295c60] hover:text-[#d2d4d1] transition-colors bg-transparent"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes slideInLeftFolder {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(0); }
                }
                .animate-folder-in {
                    animation: slideInLeftFolder 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
            `}</style>
        </div>
    );
}
// src/components/how-to-play/RolesAndObjectives.tsx

interface RoleCardProps {
	role: string;
	objective: string;
	description: string;
	colorTheme: "yellow" | "blue" | "red" | "green";
	shortName: string;
	iconName: "boss" | "intern" | "secretary" | "union";
}

function RoleCard({
	role,
	objective,
	description,
	colorTheme,
	iconName,
}: RoleCardProps) {
	const themeStyles = {
		yellow: {
			bg: "bg-yellow-50",
			borderLeft: "border-yellow-600",
			borderImg: "border-yellow-600",
			textTitle: "text-yellow-800",
		},
		blue: {
			bg: "bg-blue-50",
			borderLeft: "border-blue-600",
			borderImg: "border-blue-600",
			textTitle: "text-blue-800",
		},
		red: {
			bg: "bg-red-50",
			borderLeft: "border-red-600",
			borderImg: "border-red-600",
			textTitle: "text-red-800",
		},
		green: {
			bg: "bg-green-50",
			borderLeft: "border-green-600",
			borderImg: "border-green-600",
			textTitle: "text-green-800",
		},
	};

	const roleIcons: Record<string, string> = {
		boss: "/roles/boss_icon.png",
		intern: "/roles/intern_icon.png",
		secretary: "/roles/secretary_icon.png",
		union: "/roles/union_icon.png",
	};

	const currentTheme = themeStyles[colorTheme];

	return (
		<article
			className={`flex flex-col sm:flex-row items-start sm:items-center p-5 ${currentTheme.bg} border-l-8 ${currentTheme.borderLeft} rounded-lg shadow-sm gap-6 sm:gap-8 mt-6`}
		>
			<div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0">
				<div
					className={`absolute inset-0 bg-white rounded-full border-4 ${currentTheme.borderImg} shadow-inner`}
				></div>

				<img
					src={roleIcons[iconName]}
					alt={role}
					className="absolute z-10 w-32 h-32 max-w-25 object-contain -top-6  drop-shadow-xl transition-transform duration-300"
				/>
			</div>

			<div className="flex-1 text-center sm:text-left">
				<h4
					className={`text-2xl font-black ${currentTheme.textTitle} mb-2 uppercase tracking-wide drop-shadow-sm`}
				>
					{role}
				</h4>
				<p className="text-gray-900 font-bold mb-2 text-lg leading-tight">
					Objetivo: {objective}
				</p>
				<p className="text-gray-700 text-base leading-snug">{description}</p>
			</div>
		</article>
	);
}

export default function RolesAndObjectives() {
	return (
		<section aria-labelledby="roles-title">
			<h3 id="roles-title" className="text-2xl font-bold mb-4 text-gray-800">
				2. Roles y Objetivos
			</h3>
			<p className="mb-8 text-gray-700">
				La partida se basa en la desconfianza. Excepto el <strong>Jefe</strong>,
				cuya identidad es pública desde el inicio, el resto de empleados
				mantienen su rol oculto.
			</p>
			<div className="space-y-8 sm:space-y-5">
				<RoleCard
					role="Jefe"
					shortName="Jefe"
					iconName="boss"
					colorTheme="yellow"
					objective="Eliminar a todos los Sindicalistas y a la Becaria."
					description="El CEO de la empresa, Oswaldo Calzas. Su identidad es pública y todos saben quién es. Su misión es seguir manteniendo su empresa a flote, acabando con el Sindicato de trabajadores y con la astuta Becaria."
				/>

				<RoleCard
					role="Secretario"
					shortName="Secr."
					iconName="secretary"
					colorTheme="blue"
					objective="Proteger al Jefe."
					description="El lacayo del Jefe, Gusi Baboncia. Su lealtad a la empresa es incuestionable y hará todo lo necesario con tal de mantener su puesto. Gana la partida si el Jefe sobrevive, incluso si él mismo ha sido derrotado."
				/>

				<RoleCard
					role="Sindicato"
					shortName="Sind."
					iconName="union"
					colorTheme="red"
					objective="Eliminar al Jefe."
					description="Defensores de los derechos de los trabajadores, Torete y Samuel. Conocen todos los trapos sucios de Chaos Inc. y no tienen otro deseo que el cierre de la empresa. Su único objetivo es tener la cabeza del jefe. No les interesa acabar con el secretario o la becaria."
				/>

				<RoleCard
					role="Becaria"
					shortName="Bec."
					iconName="intern"
					colorTheme="green"
					objective="Ser el único superviviente."
					description="La novata de la oficina, Petrana. No cobra, trabaja 14 horas y está harta. Su plan es dejar que los demás se destruyan entre sí para, al final, quedarse con la empresa. Debe evitar que el sindicato gane para poder enfrentarse al secretario y al jefe."
				/>
			</div>{" "}
		</section>
	);
}

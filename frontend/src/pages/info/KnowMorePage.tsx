// src/pages/KnowMorePage.tsx

import Changelog from "../../components/know-more/Changelog";

export default function KnowMorePage() {
	return (
		<div className="pl-6 space-y-6 pb-10">
			<h1
				className="text-4xl mb-6 font-black"
				style={{ color: "var(--color-lomo)" }}
			>
				SABER MÁS
			</h1>

			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 font-bold">
				Sobre Chaos Inc.
			</h2>

			<div className="space-y-4">
				<p>
					Chaos Inc. ha sido desarrollado por una única persona, naciendo como
					un proyecto de fin de curso para un grado de formación profesional
					superior en Desarrollo de Aplicaciones Web en el centro educativo
					U-Tad.
				</p>
				<p>
					Está basado en el juego de mesa BANG!, con diferencias en las
					mecánicas de juego y la temática. No se busca plagiar el juego
					original, sino presentar nuevas ideas y cambios en las bases del
					mismo.
				</p>
			</div>

			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 mt-10 font-bold">
				Agradecimientos especiales
			</h2>

			<p>
				Agradezco el esfuerzo de las personas que contribuyeron en el desarrollo
				del proyecto:
			</p>

			<div className="grid grid-cols-2 my-10 p-4">
				<div className="flex flex-col items-center">
					<img
						src="acknowledgments/dani.png"
						alt="Avatar de Danitron"
						className="w-32 rounded-lg"
					/>
					<a
						className="mt-2 text-lg font-bold underline transform transition-transform hover:scale-105 cursor-pointer"
						href="https://discord.dog/1025390449550164000"
						target="_blank"
						rel="noopener noreferrer"
						title="Perfil de Discord de Danitron"
					>
						Danitron
					</a>
					<p className="mt-2 text-xs italic">(Artista de los roles)</p>
				</div>

				<div className="flex flex-col justify-end items-center">
					<img
						src="acknowledgments/isa.png"
						alt="Avatar de Payasy"
						className="w-30 rounded-lg"
					/>
					<a
						className="mt-2 text-lg font-bold underline transform transition-transform hover:scale-105 cursor-pointer"
						href="https://vgen.co/unapayasy"
						target="_blank"
						rel="noopener noreferrer"
						title="Página de comisiones de Payasy"
					>
						Payasy
					</a>
					<p className="mt-2 text-xs italic">(Artista de los logros)</p>
				</div>
			</div>

			<h2 className="text-xl mb-8 opacity-80 border-b border-gray-400 pb-2 mt-10 font-bold">
				Historial de versiones
			</h2>

			<p>
				Se han registrado las diferentes versiones del proyecto con el paso del
				tiempo.
			</p>

			<div className="mt-6">
				<Changelog />
			</div>
		</div>
	);
}

// src/pages/KnowMorePage.tsx

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
					Fundada con la visión de que el estrés extremo fomenta la máxima
					productividad, <strong>Chaos Inc.</strong> es pionera en la
					implementación de entornos de trabajo hostiles.
				</p>

				<p>
					Nuestra misión no es crear productos, sino observar cómo los seres
					humanos interactúan bajo presiones burocráticas absurdas. Creemos
					firmemente que de la paranoia nace la excelencia corporativa.
				</p>

				<h3 className="text-lg font-bold mt-6">
					Nuestro Historial de Versiones
				</h3>
				<p>
					El desarrollo de nuestro software interno (también conocido como "El
					Juego") está documentado meticulosamente. Puede revisar la evolución
					de nuestro sistema operativo en su expediente, donde detallamos cómo
					hemos ido optimizando las mecánicas de sufrimiento laboral.
				</p>

				<br />
				<br />
				<div className="bg-gray-400/20 p-4 rounded border border-gray-400/50">
					<p className="font-bold text-sm mb-2">CONTACTO (No funcional)</p>
					<p className="text-sm opacity-80">
						Si experimenta problemas técnicos, por favor envíe un fax al
						departamento de IT. Si no tiene fax, su problema no es prioritario.
					</p>
				</div>
			</div>
		</div>
	);
}

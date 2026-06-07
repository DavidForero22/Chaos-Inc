import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		watch: {
			usePolling: true,
		},
		host: true,
		strictPort: true,
	},
	build: {
		rollupOptions: {
			output: {
				// Dividir el código en archivos separados
				manualChunks: (id) => {
					if (id.includes("node_modules")) {
						if (id.includes("echarts")) {
							return "vendor-echarts"; 
						}
						if (id.includes("react-icons")) {
							return "vendor-icons";
						}
						if (
							id.includes("react") ||
							id.includes("react-dom") ||
							id.includes("react-router")
						) {
							return "vendor-react"; 
						}
						return "vendor"; 
					}
				},
			},
		},
	},
});

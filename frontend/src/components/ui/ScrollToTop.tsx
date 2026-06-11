import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		// Mueve el scroll del navegador arriba del todo inmediatamente
		window.scrollTo(0, 0);
	}, [pathname]); // Se ejecuta cada vez que cambia la ruta

	return null;
}

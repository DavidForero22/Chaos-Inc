import './bootstrap';

// Definimos la forma de tu evento (opcional, pero buena práctica)
interface PingEventPayload {
    message: string;
}

window.Echo.channel('test-channel')
    .listen('PingEvent', (e: PingEventPayload) => {
        console.log('Mensaje recibido:', e.message);
        alert('¡Evento recibido!: ' + e.message);
    });
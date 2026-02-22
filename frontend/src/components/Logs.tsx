import { useState, useEffect } from 'react';

export const Logs = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [status, setStatus] = useState('Conectando...');

    useEffect(() => {
        // Escuchamos el canal
        const channel = window.Echo.channel('test-channel');
        
        setStatus('Conectado a test-channel');

        channel.listen('.PingEvent', (e: { message: string }) => {
            console.log("Evento recibido en componente:", e);
            setMessages((prev) => [...prev, e.message]);
        });

        return () => {
            window.Echo.leaveChannel('test-channel');
        };
    }, []);

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Estado: <span style={{ color: 'green' }}>{status}</span></h2>
            <h3>Eventos en tiempo real:</h3>
            <ul>
                {messages.length === 0 && <li>Esperando eventos... (Lanza /fire-event)</li>}
                {messages.map((msg, i) => (
                    <li key={i}>📩 {msg}</li>
                ))}
            </ul>
        </div>
    );
};
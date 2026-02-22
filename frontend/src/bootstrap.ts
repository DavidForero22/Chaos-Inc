import axios, { type AxiosStatic } from 'axios';

// 1. Enseñamos a TypeScript que 'window.axios' existe
declare global {
    interface Window {
        axios: AxiosStatic;
    }
}

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Importamos la configuración de Echo
import './echo';
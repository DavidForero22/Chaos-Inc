# Guía de Despliegue en Producción – Chaos Inc.

## Requisitos previos

- **Docker** y **Docker Compose** instalados.
- **Git** para clonar el repositorio.
- Acceso a los registros DNS del dominio que vayas a utilizar.

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/DavidForero22/Chaos-Inc
cd chaos-inc
```

---

## 2. Configurar variables de entorno

Se necesitan **3 archivos `.env`**, uno por cada capa del proyecto. Cada carpeta incluye un `.env.example` como referencia.

### 2.1. Raíz del proyecto

> Consulta el archivo `.env.example` en la raíz del proyecto.

- Cambia todas las contraseñas (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `REDIS_PASSWORD`) por valores fuertes y únicos.
- Si usas un dominio real, ajusta `DOMAIN`, `API_URL` y `FRONTEND_URL`.
- Si despliegas en un mismo servidor sin HTTPS, puedes dejar `localhost`, aunque **no se recomienda en producción**.

### 2.2. Backend

> Consulta el archivo `.env.example` en la carpeta `backend/`.

- Asegúrate de que `SESSION_DOMAIN` y `SANCTUM_STATEFUL_DOMAINS` estén configurados con tu dominio real.
- Las credenciales de OAuth deben corresponder a tu aplicación registrada en [Google Cloud Console](https://console.cloud.google.com) y [Discord Developer Portal](https://discord.com/developers/applications).

### 2.3. Frontend

> Consulta el archivo `.env.example` en la carpeta `frontend/`.

- Solo es necesario editar este archivo si quieres cambiar el esquema (`http`/`https`) o la clave de Reverb.

---

## 3. Construir y levantar los contenedores

```bash
docker-compose -f docker-compose-prod.yml up -d --build
```

Esto construirá las imágenes, creará las redes y levantará todos los servicios en segundo plano.

**Reset completo:** Si necesitas destruir los contenedores y volúmenes para empezar desde cero:

```bash
 docker-compose -f docker-compose-prod.yml down -v
```

---

## 4. Despliegue con dominio real y HTTPS

Sigue estos pasos en orden:

1. **Configura el DNS** — apunta `mipaginaweb.com` y `api.mipaginaweb.com` a la IP de tu servidor.

2. **Actualiza el `.env` raíz** — establece `DOMAIN`, `API_URL` y `FRONTEND_URL` con las URLs reales (usa `https://`).

3. **Edita `docker-compose-prod.yml`**:
   - Cambia `VITE_REVERB_SCHEME=https` y `REVERB_SCHEME=https` en los argumentos/environment.
   - Verifica que `SANCTUM_STATEFUL_DOMAINS` contenga tu dominio real.

4. **Habilita SSL** mediante un proxy inverso. Opciones recomendadas:
   - **Caddy** — gestión automática de certificados (ya integrado si lo configuras correctamente).
   - **Nginx** — requiere configuración manual con Certbot/Let's Encrypt.
   - **FrankenPHP** — opción integrada en el propio contenedor PHP.

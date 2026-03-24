/**
 * Convierte URLs de Tigris a URLs de proxy del backend
 * Esto evita problemas de CORS y permisos en Tigris
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://red-social-backend.fly.dev';

export function getProxyUrl(originalUrl: string): string {
  // Si ya es una URL de proxy, devolverla tal cual
  if (originalUrl.includes('/proxy/media')) {
    return originalUrl;
  }

  // Si es una URL de Tigris, convertirla a proxy
  if (originalUrl.includes('fly.storage.tigris.dev')) {
    return `${BACKEND_URL}/proxy/media?url=${encodeURIComponent(originalUrl)}`;
  }

  // Para URLs de desarrollo (localhost), también usar proxy
  if (originalUrl.includes('localhost:8080/uploads')) {
    return `${BACKEND_URL}/proxy/media?url=${encodeURIComponent(originalUrl)}`;
  }

  // Para otros casos (imágenes externas), devolver la URL original
  return originalUrl;
}

/**
 * Convierte un array de URLs de medios a URLs de proxy
 */
export function getProxyUrls(urls: string[]): string[] {
  return urls.map(url => getProxyUrl(url));
}

/**
 * Verifica si una URL necesita proxy
 */
export function needsProxy(url: string): boolean {
  return url.includes('fly.storage.tigris.dev') || 
         url.includes('localhost:8080/uploads');
}

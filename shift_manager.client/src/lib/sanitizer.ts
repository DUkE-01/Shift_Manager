import DOMPurify from "dompurify";

/**
 * Sanitiza HTML para prevenir XSS. Usa DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

/**
 * Sanitiza entrada de formulario (texto plano).
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>\"']/g, (char) => {
      const escapeMap: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
      };
      return escapeMap[char] || char;
    });
}

/**
 * Valida y sanitiza una URL.
 */
export function validateAndSanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Protocolo inválido");
    }
    return parsedUrl.toString();
  } catch {
    throw new Error("URL inválida");
  }
}
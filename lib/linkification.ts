"use client";

// Expresiones regulares para detectar elementos
const REGEX = {
  // URLs (http, https, ftp)
  URL: /(https?:\/\/|ftp:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/g,
  
  // Menciones (@username)
  MENTION: /@([a-zA-Z0-9_]{1,30})/g,
  
  // Hashtags (#hashtag)
  HASHTAG: /#([\w\u00C0-\u024F\u1E00-\u1EFF]+)/g,
  
  // Email
  EMAIL: /[^\s]+@[^\s]+\.[^\s]+/g,
};

export interface LinkifiedTextOptions {
  /** Habilitar enlaces para URLs */
  urls?: boolean;
  /** Habilitar enlaces para menciones (@usuario) */
  mentions?: boolean;
  /** Habilitar enlaces para hashtags (#etiqueta) */
  hashtags?: boolean;
  /** Base URL para menciones (default: /profile/) */
  mentionBaseUrl?: string;
  /** Base URL para hashtags (default: /search?q=%23) */
  hashtagBaseUrl?: string;
  /** Abrir enlaces en nueva pestaña */
  openInNewTab?: boolean;
  /** Clases CSS personalizadas */
  classNames?: {
    url?: string;
    mention?: string;
    hashtag?: string;
    email?: string;
  };
}

export interface LinkifiedPart {
  type: "text" | "url" | "mention" | "hashtag" | "email";
  content: string;
  href?: string;
}

/**
 * Parsea texto plano y lo convierte en partes linkificadas
 * @param text - Texto plano a parsear
 * @param options - Opciones de linkificación
 * @returns Array de partes linkificadas
 */
export function parseLinkifiedText(
  text: string,
  options: LinkifiedTextOptions = {}
): LinkifiedPart[] {
  const {
    urls = true,
    mentions = true,
    hashtags = true,
    mentionBaseUrl = "/profile/",
    hashtagBaseUrl = "/search?q=%23",
  } = options;

  const parts: LinkifiedPart[] = [];
  let lastIndex = 0;

  // Encontrar todas las coincidencias
  const matches: Array<{
    index: number;
    length: number;
    type: "url" | "mention" | "hashtag" | "email";
    content: string;
    href: string;
  }> = [];

  // Buscar URLs
  if (urls) {
    let match;
    while ((match = REGEX.URL.exec(text)) !== null) {
      const url = match[0];
      // Verificar que no sea parte de otro match (como email)
      if (!url.includes("@") || url.includes("http")) {
        let href = url;
        if (!href.startsWith("http") && !href.startsWith("ftp")) {
          href = "https://" + href;
        }
        matches.push({
          index: match.index,
          length: url.length,
          type: "url",
          content: url,
          href,
        });
      }
    }
  }

  // Buscar emails
  let emailMatch;
  while ((emailMatch = REGEX.EMAIL.exec(text)) !== null) {
    const email = emailMatch[0];
    matches.push({
      index: emailMatch.index,
      length: email.length,
      type: "email",
      content: email,
      href: `mailto:${email}`,
    });
  }

  // Buscar menciones
  if (mentions) {
    let mentionMatch;
    while ((mentionMatch = REGEX.MENTION.exec(text)) !== null) {
      const mention = mentionMatch[0];
      const username = mentionMatch[1];
      matches.push({
        index: mentionMatch.index,
        length: mention.length,
        type: "mention",
        content: mention,
        href: `${mentionBaseUrl}${username}`,
      });
    }
  }

  // Buscar hashtags
  if (hashtags) {
    let hashtagMatch;
    while ((hashtagMatch = REGEX.HASHTAG.exec(text)) !== null) {
      const hashtag = hashtagMatch[0];
      const tag = hashtagMatch[1];
      matches.push({
        index: hashtagMatch.index,
        length: hashtag.length,
        type: "hashtag",
        content: hashtag,
        href: `${hashtagBaseUrl}${encodeURIComponent(tag)}`,
      });
    }
  }

  // Ordenar matches por posición
  matches.sort((a, b) => a.index - b.index);

  // Eliminar overlaps (matches que se superponen)
  const filteredMatches = matches.filter((match, index) => {
    for (let i = 0; i < index; i++) {
      const prev = matches[i];
      const prevEnd = prev.index + prev.length;
      if (match.index < prevEnd) {
        return false; // Se superpone con un match anterior
      }
    }
    return true;
  });

  // Construir partes
  for (const match of filteredMatches) {
    // Agregar texto antes del match
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Agregar el match como parte linkificada
    parts.push({
      type: match.type,
      content: match.content,
      href: match.href,
    });

    lastIndex = match.index + match.length;
  }

  // Agregar texto restante
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return parts;
}

/**
 * Convierte texto plano a HTML con links (útil para server-side o compatibilidad)
 * @param text - Texto plano
 * @param options - Opciones de linkificación
 * @returns HTML seguro con enlaces
 */
export function linkifyToHtml(
  text: string,
  options: LinkifiedTextOptions = {}
): string {
  const parts = parseLinkifiedText(text, options);
  const { openInNewTab = true } = options;

  const targetAttr = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";

  return parts
    .map((part) => {
      switch (part.type) {
        case "url":
          return `<a href="${escapeHtml(part.href!)}" class="text-indigo-600 hover:underline break-all"${targetAttr}>${escapeHtml(part.content)}</a>`;
        case "email":
          return `<a href="${escapeHtml(part.href!)}" class="text-indigo-600 hover:underline">${escapeHtml(part.content)}</a>`;
        case "mention":
          return `<a href="${escapeHtml(part.href!)}" class="text-indigo-600 hover:underline font-medium">${escapeHtml(part.content)}</a>`;
        case "hashtag":
          return `<a href="${escapeHtml(part.href!)}" class="text-indigo-600 hover:underline font-medium">${escapeHtml(part.content)}</a>`;
        case "text":
        default:
          return escapeHtml(part.content).replace(/\n/g, "<br>");
      }
    })
    .join("");
}

// Función utilitaria para escapar HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export default {
  parseLinkifiedText,
  linkifyToHtml,
};

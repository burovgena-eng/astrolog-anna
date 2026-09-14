/**
 * Task 23: SEO-центр сайта — единые константы и структурированные данные (JSON-LD).
 * Используется в layout.tsx (метаданные) и page.tsx (JSON-LD <script>).
 * Никаких внешних ресурсов: только env NEXT_PUBLIC_SITE_URL.
 */
import { TARIFFS } from "./services";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Астролог Анна | Таро и Руны";

export const SITE_DESCRIPTION =
  "Персональные консультации астролога, таролога и рунолога в Новосибирске и онлайн. За 60 минут разберу вашу ситуацию и дам чёткий план действий: натальная карта, расклад Таро, руны, прогноз.";

export const OG_IMAGE = "/og-image.jpg";

// Task 28: услуги берутся из единого источника src/lib/services.ts —
// названия и цены не могут разъехаться с секцией услуг и формой записи.
export const SERVICES = TARIFFS.map((t) => ({
  name: t.name,
  price: t.priceValue,
  description: `${t.name} — ${t.duration}`,
}));

/** JSON-LD @graph: Person (Анна) + WebSite + OfferCatalog (услуги с ценами) */
export function homeJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#anna`,
        name: "Анна",
        jobTitle: "Астролог, таролог, рунолог",
        description: SITE_DESCRIPTION,
        url: `${SITE_URL}/`,
        image: `${SITE_URL}${OG_IMAGE}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Новосибирск",
          addressCountry: "RU",
        },
        knowsAbout: ["Астрология", "Таро", "Руны", "Натальная карта", "Нумерология", "Лунный календарь"],
        makesOffer: SERVICES.map((s) => ({
          "@type": "Offer",
          name: s.name,
          description: s.description,
          price: s.price,
          priceCurrency: "RUB",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/#booking`,
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "ru-RU",
        publisher: { "@id": `${SITE_URL}/#anna` },
      },
      {
        "@type": "OfferCatalog",
        "@id": `${SITE_URL}/#services`,
        name: "Услуги",
        itemListElement: SERVICES.map((s) => ({
          "@type": "Offer",
          name: s.name,
          description: s.description,
          price: s.price,
          priceCurrency: "RUB",
        })),
      },
    ],
  };
}

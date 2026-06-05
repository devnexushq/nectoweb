import { useEffect } from "react";

type SeoOptions = {
  title: string;
  description?: string;
  canonical?: string; // path like "/c/register"
  noindex?: boolean;
};

function upsertMeta(selector: string, create: () => HTMLElement, setAttr: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  setAttr(el);
}

/**
 * Lightweight per-route SEO. Mutates document.head — safe for CSR SPA.
 */
export function useSeo({ title, description, canonical, noindex }: SeoOptions) {
  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      upsertMeta(
        'meta[name="description"]',
        () => {
          const m = document.createElement("meta");
          m.setAttribute("name", "description");
          return m;
        },
        (el) => el.setAttribute("content", description),
      );
    }

    upsertMeta(
      'meta[name="robots"]',
      () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "robots");
        return m;
      },
      (el) =>
        el.setAttribute(
          "content",
          noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large",
        ),
    );

    if (canonical) {
      const href = canonical.startsWith("http")
        ? canonical
        : `${window.location.origin}${canonical}`;
      upsertMeta(
        'link[rel="canonical"]',
        () => {
          const l = document.createElement("link");
          l.setAttribute("rel", "canonical");
          return l;
        },
        (el) => el.setAttribute("href", href),
      );
      upsertMeta(
        'meta[property="og:url"]',
        () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "og:url");
          return m;
        },
        (el) => el.setAttribute("content", href),
      );
    }

    if (title) {
      upsertMeta(
        'meta[property="og:title"]',
        () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "og:title");
          return m;
        },
        (el) => el.setAttribute("content", title),
      );
    }
    if (description) {
      upsertMeta(
        'meta[property="og:description"]',
        () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "og:description");
          return m;
        },
        (el) => el.setAttribute("content", description),
      );
    }
  }, [title, description, canonical, noindex]);
}

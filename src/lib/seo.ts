import { useEffect } from "react";

const SITE_NAME = "NECTO";
const DEFAULT_IMAGE = "https://nectoweb.vercel.app/icon-512.png";

type SeoOptions = {
  title: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  image?: string;
  type?: "website" | "article" | "profile";
};

function upsertMeta(selector: string, create: () => HTMLElement, setAttr: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  setAttr(el);
}

function setNamedMeta(name: string, content: string) {
  upsertMeta(
    `meta[name="${name}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("name", name);
      return m;
    },
    (el) => el.setAttribute("content", content),
  );
}

function setPropertyMeta(property: string, content: string) {
  upsertMeta(
    `meta[property="${property}"]`,
    () => {
      const m = document.createElement("meta");
      m.setAttribute("property", property);
      return m;
    },
    (el) => el.setAttribute("content", content),
  );
}

function absoluteUrl(value: string) {
  if (value.startsWith("http")) return value;
  return `${window.location.origin}${value.startsWith("/") ? value : `/${value}`}`;
}

export function useSeo({ title, description, canonical, noindex, image = DEFAULT_IMAGE, type = "website" }: SeoOptions) {
  useEffect(() => {
    const canonicalHref = canonical ? absoluteUrl(canonical) : window.location.href.split("#")[0];
    const robots = noindex
      ? "noindex,nofollow,noarchive"
      : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1";
    const resolvedImage = absoluteUrl(image);

    if (title) document.title = title;

    setNamedMeta("description", description ?? "NECTO helps people discover trusted local workers, shops, services, and products near them.");
    setNamedMeta("robots", robots);
    setNamedMeta("googlebot", robots);
    setNamedMeta("application-name", SITE_NAME);
    setNamedMeta("twitter:card", "summary_large_image");
    setNamedMeta("twitter:title", title);
    setNamedMeta("twitter:description", description ?? "Discover trusted local workers and shops near you with NECTO.");
    setNamedMeta("twitter:image", resolvedImage);
    setNamedMeta("twitter:image:alt", "NECTO local marketplace app logo");

    upsertMeta(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      },
      (el) => el.setAttribute("href", canonicalHref),
    );

    setPropertyMeta("og:locale", "en_IN");
    setPropertyMeta("og:site_name", SITE_NAME);
    setPropertyMeta("og:type", type);
    setPropertyMeta("og:title", title);
    setPropertyMeta("og:description", description ?? "Discover trusted local workers and shops near you with NECTO.");
    setPropertyMeta("og:url", canonicalHref);
    setPropertyMeta("og:image", resolvedImage);
    setPropertyMeta("og:image:secure_url", resolvedImage);
    setPropertyMeta("og:image:alt", "NECTO local marketplace app logo");
  }, [title, description, canonical, noindex, image, type]);
}

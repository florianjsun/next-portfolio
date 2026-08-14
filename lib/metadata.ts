import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

interface CreatePageMetadataOptions {
  title: string;
  description: string;
  path: `/${string}`;
  keywords?: Metadata["keywords"];
}

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
}: CreatePageMetadataOptions): Metadata {
  const canonicalUrl = new URL(path, siteConfig.url).toString();
  const socialTitle = `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "zh_CN",
      url: canonicalUrl,
      title: socialTitle,
      description,
      siteName: siteConfig.name,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      creator: `@${siteConfig.username}`,
    },
  };
}

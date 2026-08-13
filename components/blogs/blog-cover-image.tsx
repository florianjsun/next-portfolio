/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

import { isExternalUrl } from "@/lib/urls";

interface BlogCoverImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: "eager" | "lazy";
}

export function BlogCoverImage({
  src,
  alt,
  className,
  fill = false,
  width = 768,
  height = 400,
  sizes,
  loading = "lazy",
}: BlogCoverImageProps) {
  if (isExternalUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        loading={loading}
        fetchPriority={loading === "eager" ? "high" : undefined}
        className={
          fill ? `absolute inset-0 h-full w-full ${className}` : className
        }
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        loading={loading}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      loading={loading}
    />
  );
}

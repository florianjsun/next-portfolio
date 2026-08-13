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
  priority?: boolean;
}

export function BlogCoverImage({
  src,
  alt,
  className,
  fill = false,
  width = 768,
  height = 400,
  sizes,
  priority = false,
}: BlogCoverImageProps) {
  if (isExternalUrl(src)) {
    return (
      <img
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
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
        priority={priority}
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
      priority={priority}
    />
  );
}

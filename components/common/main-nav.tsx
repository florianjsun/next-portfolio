"use client";

import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";

import { MobileNav } from "@/components/common/mobile-nav";
import type { NavItem } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { fontNorican } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface MainNavProps {
  items?: NavItem[];
  children?: React.ReactNode;
}

const MOBILE_NAV_ID = "mobile-navigation";

// Animation variants for the navigation items
const navItemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  return (
    <div className="flex gap-6 md:gap-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="hidden items-center space-x-2 md:flex">
          <span className={cn(fontNorican.className, "text-2xl")}>
            {siteConfig.authorName}
          </span>
        </Link>
      </motion.div>
      {items?.length ? (
        <nav
          aria-label="Main navigation"
          className="hidden gap-6 md:flex items-center"
        >
          {items.map((item, index) => (
            <motion.div
              key={item.href}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={navItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.disabled ? "#" : item.href}
                aria-disabled={item.disabled || undefined}
                className={cn(
                  "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                  item.href.startsWith(`/${segment}`)
                    ? "text-foreground"
                    : "text-foreground/60",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                {item.title}
              </Link>
            </motion.div>
          ))}
        </nav>
      ) : null}
      <motion.button
        type="button"
        aria-controls={MOBILE_NAV_ID}
        aria-expanded={showMobileMenu}
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {showMobileMenu ? <X /> : <Menu />}
        <span className="font-bold">Menu</span>
      </motion.button>
      {showMobileMenu && items && (
        <MobileNav id={MOBILE_NAV_ID} items={items}>
          {children}
        </MobileNav>
      )}
    </div>
  );
}

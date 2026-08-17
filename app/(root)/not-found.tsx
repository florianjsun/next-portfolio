import Link from "next/link";

import { ClientPageWrapper } from "@/components/common/client-page-wrapper";
import { Icons } from "@/components/common/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <ClientPageWrapper>
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 font-heading text-3xl leading-tight sm:text-4xl">
          页面未找到
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          你访问的页面不存在或已被移除。
        </p>
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>
      </div>
    </ClientPageWrapper>
  );
}

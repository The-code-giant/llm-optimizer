'use client'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeSwitcher } from "@/components/ui/theme-switcher"
import { NAV_DATA } from "@/components/app-sidebar"
import { usePathname } from "next/navigation"
export function SiteHeader() {
  const pathname = usePathname()
  const currentPage = pathname.split("/").pop()
  const currentPageData = NAV_DATA.navMain.find((item) => item.url === `/${currentPage}`)
  const currentPageTitle = currentPageData?.title || "Documents"
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{currentPageTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitcher />
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              Clever Search
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

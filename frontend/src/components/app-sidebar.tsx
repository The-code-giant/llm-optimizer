"use client";
import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconRobot,
  IconGlobe,
  IconReport,
  IconSettings,
  IconCreditCard,
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
export const NAV_DATA = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    // {
    //   title: "sites",
    //   url: "/dashboard",
    //   icon: IconGlobe,
    // },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: IconCreditCard,
    },
    {
      title: "Auto Agent",
      url: "/dashboard/auto-agent",
      icon: IconRobot,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/profile",
      icon: IconSettings,
    },
  ],
  documents: [
    {
      name: "Documentation",
      url: "/docs",
      icon: IconDatabase,
    },
    {
      name: "Blogs",
      url: "blog",
      icon: IconReport,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const data = {
    user: {
      name: user?.fullName || "User",
      email: user?.emailAddresses[0].emailAddress || "user@example.com",
      avatar: user?.imageUrl || "/avatars/shadcn.jpg",
    },
    ...NAV_DATA,
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" className="w-full flex justify-start items-start">
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 h-[45px]"
              >
                <div>
                <Image
                 className="block dark:hidden w-auto h-auto"
                  src="/logo/clever-search-logo-black.png"
                  alt="CleverSearch"
                  width={100}
                  height={50}
                
                />
                 <Image
                 className="hidden dark:block w-auto h-auto"
                  src="/logo/clever-search-logo-white.png"
                  alt="CleverSearch"
                  width={100}
                  height={50}
                />
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

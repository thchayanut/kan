import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@headlessui/react";
import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
} from "react-icons/tb";
import { twMerge } from "tailwind-merge";

import boardsIconDark from "~/assets/boards-dark.json";
import boardsIconLight from "~/assets/boards-light.json";
import membersIconDark from "~/assets/members-dark.json";
import membersIconLight from "~/assets/members-light.json";
import settingsIconDark from "~/assets/settings-dark.json";
import settingsIconLight from "~/assets/settings-light.json";
import ReactiveButton from "~/components/ReactiveButton";
import UserMenu from "~/components/UserMenu";
import WorkspaceMenu from "~/components/WorkspaceMenu";
import { useTheme } from "~/providers/theme";

interface SideNavigationProps {
  user: UserType;
  isLoading: boolean;
}

interface UserType {
  email?: string | null | undefined;
  image?: string | null | undefined;
}

export default function SideNavigation({
  user,
  isLoading,
}: SideNavigationProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialised, setIsInitialised] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("kan_sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
    setIsInitialised(true);
  }, []);

  useEffect(() => {
    if (isInitialised) {
      localStorage.setItem(
        "kan_sidebar-collapsed",
        JSON.stringify(isCollapsed),
      );
    }
  }, [isCollapsed, isInitialised]);

  const { pathname } = router;

  const { activeTheme } = useTheme();

  const isDarkMode = activeTheme === "dark";

  const navigation = [
    {
      name: t`Boards`,
      href: "/boards",
      icon: isDarkMode ? boardsIconDark : boardsIconLight,
    },
    {
      name: t`Members`,
      href: "/members",
      icon: isDarkMode ? membersIconDark : membersIconLight,
    },
    {
      name: t`Settings`,
      href: "/settings",
      icon: isDarkMode ? settingsIconDark : settingsIconLight,
    },
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <nav
        className={twMerge(
          "flex h-full flex-col justify-between bg-light-100 pr-3 dark:bg-dark-100",
          isCollapsed ? "w-auto" : "w-64",
        )}
      >
        <div>
          <div className="flex h-14 items-center justify-between pb-[18px] pt-1.5">
            {!isCollapsed && (
              <Link href="/" className="block">
                <h1 className="pl-2 text-lg font-bold tracking-tight text-neutral-700 dark:text-dark-1000">
                  kan.bn
                </h1>
              </Link>
            )}
            <Button
              onClick={toggleCollapse}
              className={twMerge(
                "flex h-8 items-center justify-center rounded-md hover:bg-light-200 dark:hover:bg-dark-200",
                isCollapsed ? "w-full" : "w-8",
              )}
            >
              {isCollapsed ? (
                <TbLayoutSidebarLeftExpand
                  size={18}
                  className="text-light-900 dark:text-dark-900"
                />
              ) : (
                <TbLayoutSidebarLeftCollapse
                  size={18}
                  className="text-light-900 dark:text-dark-900"
                />
              )}
            </Button>
          </div>
          <div className="mx-1 mb-4 w-auto border-b border-light-300 dark:border-dark-400" />

          <WorkspaceMenu isCollapsed={isCollapsed} />
          <ul role="list" className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <ReactiveButton
                  href={item.href}
                  current={pathname.includes(item.href)}
                  name={item.name}
                  json={item.icon}
                  isCollapsed={isCollapsed}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <UserMenu
            email={user.email ?? ""}
            imageUrl={user.image ?? undefined}
            isLoading={isLoading}
            isCollapsed={isCollapsed}
          />
        </div>
      </nav>
    </>
  );
}

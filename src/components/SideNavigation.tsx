import { usePathname } from "next/navigation";

import { useTheme } from "~/providers/theme";

import boardsIconDark from "~/assets/boards-dark.json";
import boardsIconLight from "~/assets/boards-light.json";
import membersIconDark from "~/assets/members-dark.json";
import membersIconLight from "~/assets/members-light.json";
import settingsIconDark from "~/assets/settings-dark.json";
import settingsIconLight from "~/assets/settings-light.json";

import ReactiveButton from "~/components/ReactiveButton";
import UserMenu from "~/components/UserMenu";
import WorkspaceMenu from "~/components/WorkspaceMenu";

interface SideNavigationProps {
  user: UserType;
}

interface UserType {
  email?: string | null | undefined;
  image?: string | null | undefined;
}

export default function SideNavigation({ user }: SideNavigationProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  const navigation = [
    {
      name: "Boards",
      href: "/boards",
      icon: theme === "dark" ? boardsIconDark : boardsIconLight,
    },
    {
      name: "Members",
      href: "/members",
      icon: theme === "dark" ? membersIconDark : membersIconLight,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: theme === "dark" ? settingsIconDark : settingsIconLight,
    },
  ];

  return (
    <>
      <nav className="flex w-72 flex-col justify-between border-r border-light-600 px-3 pb-3 pt-5 dark:border-dark-600">
        <div>
          <WorkspaceMenu />
          <ul role="list" className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <ReactiveButton
                  href={item.href}
                  current={pathname?.includes(item.href)}
                  name={item.name}
                  json={item.icon}
                />
              </li>
            ))}
          </ul>
        </div>
        <UserMenu
          email={user?.email ?? ""}
          imageUrl={user?.image ?? undefined}
        />
      </nav>
    </>
  );
}

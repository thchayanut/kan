import { useRef, useState } from "react";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarLeftExpand,
  TbLayoutSidebarRightCollapse,
  TbLayoutSidebarRightExpand,
} from "react-icons/tb";

import { authClient } from "@kan/auth/client";

import { useClickOutside } from "~/hooks/useClickOutside";
import { useTheme } from "~/providers/theme";
import SideNavigation from "./SideNavigation";

interface DashboardProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  hasRightPanel?: boolean;
}

export default function Dashboard({
  children,
  rightPanel,
  hasRightPanel = false,
}: DashboardProps) {
  const theme = useTheme();

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const sideNavRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const sideNavButtonRef = useRef<HTMLButtonElement>(null);
  const rightPanelButtonRef = useRef<HTMLButtonElement>(null);

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
    if (!isSideNavOpen) {
      setIsRightPanelOpen(false);
    }
  };

  const toggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
    if (!isRightPanelOpen) {
      setIsSideNavOpen(false);
    }
  };

  useClickOutside(sideNavRef, (event) => {
    if (sideNavButtonRef.current?.contains(event.target as Node)) {
      return;
    }
    if (isSideNavOpen) {
      setIsSideNavOpen(false);
    }
  });

  useClickOutside(rightPanelRef, (event) => {
    if (rightPanelButtonRef.current?.contains(event.target as Node)) {
      return;
    }
    if (isRightPanelOpen) {
      setIsRightPanelOpen(false);
    }
  });

  const isDarkMode = theme.activeTheme === "dark";

  return (
    <>
      <style jsx global>{`
        html {
          height: 100vh;
          overflow: hidden;
          min-width: 320px;
          background-color: ${!isDarkMode ? "hsl(0deg 0% 97.3%)" : "#1c1c1c"};
        }
      `}</style>
      <div className="relative flex h-screen flex-col bg-light-100 px-3 py-3 dark:bg-dark-100">
        {/* Mobile Navigation Controls - positioned absolutely over content */}
        <div className="absolute left-8 top-8 z-50 flex items-center gap-2 md:hidden">
          <button
            ref={sideNavButtonRef}
            onClick={toggleSideNav}
            className="rounded p-1.5 transition-all hover:bg-light-200 dark:hover:bg-dark-100"
          >
            {isSideNavOpen ? (
              <TbLayoutSidebarLeftCollapse
                size={20}
                className="text-light-900 dark:text-dark-900"
              />
            ) : (
              <TbLayoutSidebarLeftExpand
                size={20}
                className="text-light-900 dark:text-dark-900"
              />
            )}
          </button>
        </div>

        {/* {hasRightPanel && (
          <div className="absolute right-8 top-8 z-50 md:hidden">
            <button
              ref={rightPanelButtonRef}
              onClick={toggleRightPanel}
              className="rounded p-1.5 transition-all hover:bg-light-200 dark:hover:bg-dark-100"
            >
              {isRightPanelOpen ? (
                <TbLayoutSidebarRightCollapse
                  size={20}
                  className="text-light-900 dark:text-dark-900"
                />
              ) : (
                <TbLayoutSidebarRightExpand
                  size={20}
                  className="text-light-900 dark:text-dark-900"
                />
              )}
            </button>
          </div>
        )} */}

        <div className="flex h-[calc(100vh-1.5rem)] min-h-0 w-full">
          <div
            ref={sideNavRef}
            className={`fixed left-3 top-3 z-40 h-[calc(100dvh-1.5rem)] transform transition-transform duration-300 ease-in-out md:relative md:left-0 md:top-0 md:h-full md:translate-x-0 ${isSideNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} `}
          >
            <SideNavigation
              user={{ email: session?.user.email, image: session?.user.image }}
              isLoading={sessionLoading}
            />
          </div>

          <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl border border-light-300 bg-light-50 dark:border-dark-200 dark:bg-dark-50">
            <div className="relative flex h-full min-h-0 w-full overflow-hidden">
              <div className="h-full w-full overflow-y-auto">{children}</div>

              {/* Mobile Right Panel */}
              {hasRightPanel && rightPanel && (
                <div
                  ref={rightPanelRef}
                  className={`fixed right-3 top-3 z-40 h-[calc(100dvh-1.5rem)] w-80 transform bg-light-200 transition-transform duration-300 ease-in-out dark:bg-dark-100 md:hidden ${
                    isRightPanelOpen ? "translate-x-0" : "translate-x-full"
                  }`}
                >
                  <div className="h-full overflow-y-auto rounded-md border dark:border-dark-200">
                    {rightPanel}
                  </div>
                </div>
              )}

              {/* Desktop Right Panel */}
              {hasRightPanel && rightPanel && (
                <div className="hidden md:block">{rightPanel}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

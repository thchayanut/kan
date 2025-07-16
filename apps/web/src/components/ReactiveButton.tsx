import Link from "next/link";
import { useState } from "react";

import LottieIcon from "~/components/LottieIcon";

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

const Button: React.FC<{
  href: string;
  current: boolean;
  name: string;
  json: object;
  isCollapsed?: boolean;
}> = ({ href, current, name, json, isCollapsed = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [index, setIndex] = useState(0);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIndex((index) => index + 1);
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      className={classNames(
        "group flex h-[34px] items-center rounded-md p-1.5 text-sm font-normal leading-6 text-neutral-900 hover:bg-light-200 dark:hover:bg-dark-200 dark:hover:text-dark-1000",
        current
          ? "bg-light-200 dark:bg-dark-200 dark:text-dark-1000"
          : "dark:bg-dark-100 dark:text-dark-900",
        isCollapsed ? "justify-center" : "gap-x-3",
      )}
      title={isCollapsed ? name : undefined}
    >
      <LottieIcon index={index} json={json} isPlaying={isHovered} />
      {!isCollapsed && name}
    </Link>
  );
};

export default Button;

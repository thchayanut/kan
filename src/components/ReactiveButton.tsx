import { useState } from "react";
import Link from "next/link";

import LottieIcon from "~/components/LottieIcon";

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

const Button: React.FC<{
  href: string;
  current: boolean;
  name: string;
  json: object;
}> = ({ href, current, name, json }) => {
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
        current ? "bg-light-200  dark:bg-dark-200" : " dark:bg-dark-50",
        "group flex items-center gap-x-3 rounded-md p-1.5 text-sm font-normal leading-6 text-neutral-900 hover:bg-light-200 dark:text-dark-1000 dark:hover:bg-dark-200",
      )}
    >
      <LottieIcon index={index} json={json} isPlaying={isHovered} />
      {name}
    </Link>
  );
};

export default Button;

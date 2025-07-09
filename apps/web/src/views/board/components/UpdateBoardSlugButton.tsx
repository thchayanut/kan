import Link from "next/link";
import { env } from "next-runtime-env";
import { HiLink } from "react-icons/hi";

const UpdateBoardSlugButton = ({
  handleOnClick,
  workspaceSlug,
  boardSlug,
}: {
  handleOnClick: () => void;
  workspaceSlug: string;
  boardSlug: string;
}) => {
  return (
    <button
      onClick={handleOnClick}
      className="flex cursor-pointer items-center gap-2 rounded-full border-[1px] bg-light-50 p-1 pl-4 pr-1 text-sm text-light-950 hover:bg-light-100 dark:border-dark-600 dark:bg-dark-50 dark:text-dark-900 dark:hover:bg-dark-100"
    >
      <div className="flex items-center">
        <span>
          {env("NEXT_PUBLIC_KAN_ENV") === "cloud"
            ? "kan.bn"
            : env("NEXT_PUBLIC_BASE_URL")}
        </span>
        <div className="mx-1.5 h-4 w-px rotate-[20deg] bg-gray-300 dark:bg-dark-600"></div>
        <span>{workspaceSlug}</span>
        <div className="mx-1.5 h-4 w-px rotate-[20deg] bg-gray-300 dark:bg-dark-600"></div>
        <span>{boardSlug}</span>
      </div>
      <Link
        href={`${env("NEXT_PUBLIC_BASE_URL")}/${workspaceSlug}/${boardSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-light-200 dark:hover:bg-dark-200"
      >
        <HiLink className="h-[13px] w-[13px]" />
      </Link>
    </button>
  );
};

export default UpdateBoardSlugButton;

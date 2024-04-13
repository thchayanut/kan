import Link from "next/link";

import { api } from "~/utils/api";
import { useWorkspace } from "~/providers/workspace";

export function BoardsList() {
  const { workspace } = useWorkspace();

  const { data } = api.board.all.useQuery(
    { workspacePublicId: workspace?.publicId },
    { enabled: workspace?.publicId ? true : false },
  );

  if (data?.length === 0) return <></>;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5">
      {data?.map((board) => (
        <Link key={board.publicId} href={`boards/${board.publicId}`}>
          <div className="align-center relative mr-5 flex h-[150px] w-full items-center justify-center rounded-md border border-dashed border-light-600 bg-light-50 shadow-sm hover:bg-light-200 dark:border-dark-600 dark:bg-dark-100 dark:hover:bg-dark-200">
            <div>
              <svg
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  top: "0px",
                  left: "0px",
                  color: "white",
                }}
              >
                <pattern
                  id="pattern"
                  x="0.034759358288862785"
                  y="3.335370511841166"
                  width="14.423223834988539"
                  height="14.423223834988539"
                  patternUnits="userSpaceOnUse"
                  patternTransform="translate(-0.45072574484339184,-0.45072574484339184)"
                >
                  <circle
                    cx="0.45072574484339184"
                    cy="0.45072574484339184"
                    r="0.45072574484339184"
                    fill="#3e3e3e"
                  ></circle>
                </pattern>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="url(#pattern)"
                ></rect>
              </svg>
            </div>
            <p className="text-md px-4 font-medium text-neutral-900 dark:text-dark-1000">
              {board.name}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

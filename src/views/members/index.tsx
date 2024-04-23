import { HiOutlinePlusSmall } from "react-icons/hi2";
import { useModal } from "~/providers/modal";
import { useWorkspace } from "~/providers/workspace";
import Modal from "~/components/modal";

import { NewWorkspaceForm } from "~/components/NewWorkspaceForm";

import { api } from "~/utils/api";

export default function MembersPage() {
  const { modalContentType } = useModal();
  const { workspace } = useWorkspace();

  const { data } = api.workspace.byId.useQuery(
    { publicId: workspace.publicId },
    { enabled: workspace?.publicId ? true : false },
  );

  return (
    <div className="px-28 py-12">
      <div className="mb-8 flex w-full justify-between">
        <h1 className="font-medium tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
          Members
        </h1>
        <div className="flex">
          <button
            type="button"
            className="flex items-center gap-x-1.5 rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-dark-1000 dark:text-dark-50"
            // onClick={() => openModal("")}
          >
            <div className="h-5 w-5 items-center">
              <HiOutlinePlusSmall
                className="-mr-0.5 h-5 w-5"
                aria-hidden="true"
              />
            </div>
            Invite
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-light-600 dark:divide-dark-600">
                <thead className="bg-light-300 dark:bg-dark-200">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-light-900 dark:text-dark-900 sm:pl-6"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-light-900 dark:text-dark-900"
                    >
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-600 bg-light-50 dark:divide-dark-600 dark:bg-dark-100">
                  {data?.members.map((member) => (
                    <tr key={member.publicId}>
                      <td>
                        <div className="flex items-center p-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-light-1000 dark:bg-dark-400">
                              <span className="text-sm font-medium leading-none text-white">
                                {member.user?.name
                                  ?.split(" ")
                                  .map((namePart) =>
                                    namePart.charAt(0).toUpperCase(),
                                  )
                                  .join("")}
                              </span>
                            </span>
                          </div>
                          <div className="ml-2 min-w-0 flex-1">
                            <div>
                              <div className="flex items-center">
                                <p className="mr-2 text-sm font-medium text-neutral-900 dark:text-dark-1000">
                                  {member.user?.name}
                                </p>
                              </div>
                              <p className="truncate text-sm text-dark-900">
                                {member.user?.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="px-3">
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            {member.role.charAt(0).toUpperCase() +
                              member.role.slice(1)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal>
        {modalContentType === "NEW_WORKSPACE" && <NewWorkspaceForm />}
      </Modal>
    </div>
  );
}

import { useModal } from "~/providers/modal";
import Modal from "~/components/modal";

import { NewWorkspaceForm } from "~/components/NewWorkspaceForm";

export default function SettingsPage() {
  const { modalContentType } = useModal();

  return (
    <div className="px-28 py-12">
      <div className="mb-8 flex w-full justify-between">
        <h1 className="font-medium tracking-tight text-neutral-900 dark:text-dark-1000 sm:text-[1.2rem]">
          Settings
        </h1>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg"></div>
          </div>
        </div>
      </div>

      <Modal>
        {modalContentType === "NEW_WORKSPACE" && <NewWorkspaceForm />}
      </Modal>
    </div>
  );
}

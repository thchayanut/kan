import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { HiEllipsisHorizontal } from "react-icons/hi2";
import { useModal } from "~/providers/modal";

interface ListDropdownProps {
  setSelectedPublicListId: () => void;
}

export default function ListDropdown({
  setSelectedPublicListId,
}: ListDropdownProps) {
  const { openModal } = useModal();

  const handleOpenDeleteListConfirmation = () => {
    setSelectedPublicListId();
    openModal("DELETE_LIST");
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="mr-1 inline-flex h-fit items-center rounded-md p-1 px-1 text-sm font-semibold text-dark-50 hover:bg-light-400 dark:hover:bg-dark-400">
          <HiEllipsisHorizontal className="h-5 w-5 text-dark-900" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="dark-text-dark-1000 absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md border border-light-400 bg-light-50 text-neutral-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-dark-400 dark:bg-dark-300">
          <div className="flex">
            <Menu.Item>
              <button
                onClick={handleOpenDeleteListConfirmation}
                className="m-1 w-full rounded-[5px] px-3 py-2 text-left text-sm hover:bg-light-400 dark:hover:bg-dark-400"
              >
                Delete list
              </button>
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

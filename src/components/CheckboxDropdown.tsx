import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";

interface CheckboxDropdownProps {
  children: React.ReactNode;
  items: {
    key: string;
    value: string | null;
    selected: boolean;
  }[];
  handleSelect: (item: { key: string }) => void;
}

export default function CheckboxDropdown({
  children,
  items,
  handleSelect,
}: CheckboxDropdownProps) {
  return (
    <>
      <Menu
        as="div"
        className="relative flex w-full flex-wrap items-center text-left"
      >
        <Menu.Button>{children}</Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 top-[26px] z-10 mt-2 w-56 origin-top-left rounded-md border-[1px] border-light-200 bg-light-50 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-dark-500 dark:bg-dark-200">
            <div className="p-1">
              {items?.map((item) => (
                <Menu.Item key={item.key}>
                  <div
                    key={item.key}
                    className="flex items-center rounded-[5px] p-2 hover:bg-light-200 dark:hover:bg-dark-300"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelect({ key: item.key });
                    }}
                  >
                    <input
                      id={item.key}
                      name={item.key}
                      type="checkbox"
                      className="h-[14px] w-[14px] rounded bg-transparent"
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => handleSelect({ key: item.key })}
                      checked={item.selected}
                    />
                    <label
                      htmlFor={item.key}
                      className="ml-3 text-sm text-dark-900"
                    >
                      {item.value}
                    </label>
                  </div>
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}

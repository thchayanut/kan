import { Fragment } from "react";
import { api } from "~/utils/api";
import { Menu, Transition } from "@headlessui/react";
import { HiMiniPlus } from "react-icons/hi2";
import { useFormik } from "formik";

import { useModal } from "~/providers/modal";

interface LabelSelectorProps {
  cardPublicId: string;
  labels: {
    publicId: string;
    name: string;
    selected: boolean;
    colourCode: string;
  }[];
}

export default function LabelSelector({
  cardPublicId,
  labels,
}: LabelSelectorProps) {
  const { openModal } = useModal();
  const utils = api.useUtils();

  const refetchCard = () => utils.card.byId.refetch({ id: cardPublicId });

  const addOrRemoveLabel = api.card.addOrRemoveLabel.useMutation({
    onSuccess: async () => {
      await refetchCard();
    },
  });

  const formik = useFormik({
    initialValues: {
      ...Object.fromEntries(
        labels?.map((label) => [label.publicId, label.selected]) ?? [],
      ),
    },
    onSubmit: (values) => {
      console.log({ values });
    },
    enableReinitialize: true,
  });

  const selectedLabels = labels.filter((label) => label.selected);

  return (
    <>
      <Menu
        as="div"
        className="relative flex w-full flex-wrap items-center text-left"
      >
        {selectedLabels.length ? (
          <>
            {selectedLabels.map((label) => (
              <Menu.Button
                key={label.publicId}
                className="my-1 mr-2 inline-flex w-fit items-center gap-x-1.5 rounded-full px-2 py-1 text-[12px] font-medium text-light-800 ring-1 ring-inset ring-light-600 dark:text-dark-1000 dark:ring-dark-800"
              >
                <svg
                  fill={label.colourCode}
                  className="h-2 w-2"
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                >
                  <circle cx={3} cy={3} r={3} />
                </svg>
                <div>{label.name}</div>
              </Menu.Button>
            ))}
            <Menu.Button className="my-1 inline-flex w-fit items-center gap-x-1.5 rounded-full py-1 pl-2 pr-4 text-[12px] font-medium text-dark-800 ring-inset ring-dark-800 hover:bg-light-400 dark:hover:bg-dark-200">
              <HiMiniPlus size={16} />
              Add label
            </Menu.Button>
          </>
        ) : (
          <Menu.Button className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-200 pl-2 text-left text-sm text-neutral-900 hover:bg-light-300 dark:border-dark-100 dark:text-dark-1000 dark:hover:border-dark-300 dark:hover:bg-dark-200">
            <HiMiniPlus size={22} className="pr-2" />
            Add label
          </Menu.Button>
        )}

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-[200px] top-[30px] z-10 mt-2 w-56 origin-top-right rounded-md border-[1px] border-light-600 bg-light-50 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-dark-500 dark:bg-dark-200">
            <div className="p-2">
              <form onSubmit={formik.handleSubmit}>
                {labels?.map((label) => (
                  <Menu.Item key={label.publicId}>
                    {() => (
                      <div
                        key={label.publicId}
                        className="flex items-center rounded-[5px] p-2 hover:bg-light-200 dark:hover:bg-dark-300"
                        onClick={async (e) => {
                          e.preventDefault();
                          await formik.setFieldValue(
                            label.publicId,
                            !formik.values[label.publicId],
                          );

                          addOrRemoveLabel.mutate({
                            cardPublicId,
                            labelPublicId: label.publicId,
                          });

                          await formik.submitForm();
                        }}
                      >
                        <input
                          id={label.publicId}
                          name={label.publicId}
                          type="checkbox"
                          className="h-[14px] w-[14px] rounded bg-transparent"
                          onClick={(event) => event.stopPropagation()}
                          onChange={formik.handleChange}
                          checked={formik.values[label.publicId]}
                        />
                        <label
                          htmlFor={label.publicId}
                          className="ml-3 text-sm"
                        >
                          {label.name}
                        </label>
                      </div>
                    )}
                  </Menu.Item>
                ))}
                <button
                  onClick={() => openModal("NEW_LABEL")}
                  className="flex w-full items-center rounded-[5px] p-1.5 px-2 text-sm hover:bg-light-200 dark:hover:bg-dark-300"
                >
                  <HiMiniPlus size={22} className="pr-2" />
                  Create new label
                </button>
              </form>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}

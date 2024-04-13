import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { api } from "~/utils/api";

import { HiChevronUpDown, HiXMark } from "react-icons/hi2";

import { useModal } from "~/providers/modal";

import { Formik, Form, Field } from "formik";

interface FormValues {
  name: string;
  colour: Colour | undefined;
}

interface Colour {
  name: string;
  code: string;
}

interface cardPublicId {
  cardPublicId: string;
}

const colours = [
  { name: "Teal", code: "#0d9488" },
  { name: "Green", code: "#65a30d" },
  { name: "Blue", code: "#0284c7" },
  { name: "Purple", code: "#4f46e5" },
  { name: "Yellow", code: "#ca8a04" },
  { name: "Orange", code: "#ea580c " },
  { name: "Red", code: "#dc2626" },
  { name: "Pink", code: "#db2777" },
];

export function NewLabelForm({ cardPublicId }: cardPublicId) {
  const [selected, setSelected] = useState(colours[0]);
  const utils = api.useUtils();
  const { closeModal } = useModal();

  const refetchCard = () => utils.card.byId.refetch({ id: cardPublicId });

  const createLabel = api.label.create.useMutation({
    onSuccess: async () => {
      try {
        await refetchCard();
        closeModal();
      } catch (e) {
        console.log(e);
      }
    },
  });

  return (
    <>
      <div className="flex w-full items-center justify-between pb-4 text-neutral-900 dark:text-dark-1000">
        <h2 className="text-sm font-medium">New label</h2>
        <button
          className="rounded p-1 hover:bg-light-300 focus:outline-none dark:hover:bg-dark-300"
          onClick={() => closeModal()}
        >
          <HiXMark size={18} className="text-light-900 dark:text-dark-900" />
        </button>
      </div>

      <Formik
        initialValues={{
          name: "",
          colour: colours[0],
        }}
        onSubmit={(values: FormValues) => {
          if (!values.colour?.code) return;

          createLabel.mutate({
            name: values.name,
            cardPublicId,
            colourCode: values.colour.code,
          });
        }}
      >
        <Form>
          <label
            htmlFor="name"
            className="block pb-2 text-sm font-normal leading-6 text-neutral-900 dark:text-dark-1000"
          >
            Name
          </label>
          <Field
            id="name"
            name="name"
            className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-600 dark:bg-dark-300 dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
          />
          <Listbox value={selected} onChange={setSelected}>
            {({ open }) => (
              <>
                <div className="relative mt-4">
                  <Listbox.Button className="block w-full rounded-md border-0 bg-white/5 px-4 py-1.5 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-600 dark:bg-dark-300 dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6">
                    <span className="flex items-center">
                      <span
                        style={{ backgroundColor: selected?.code }}
                        className={`inline-block h-2 w-2 flex-shrink-0 rounded-full`}
                      />
                      <span className="ml-3 block truncate">
                        {selected?.name}
                      </span>
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <HiChevronUpDown
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-light-50 py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-dark-300 sm:text-sm">
                      {colours.map((colour, index) => (
                        <Listbox.Option
                          key={`colours_${index}`}
                          className="relative cursor-default select-none px-2 text-neutral-900 dark:text-dark-1000 "
                          value={colour}
                        >
                          {() => (
                            <>
                              <div className="flex items-center rounded-[5px] p-2 hover:bg-light-200 dark:hover:bg-dark-400">
                                <span
                                  style={{ backgroundColor: colour?.code }}
                                  className="ml-2 inline-block h-2 w-2 flex-shrink-0 rounded-full"
                                  aria-hidden="true"
                                />
                                <span className="ml-3 block truncate font-normal">
                                  {colour.name}
                                </span>
                              </div>
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
          <div className="mt-5 sm:mt-6">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 shadow-sm focus-visible:outline-none dark:bg-dark-1000 dark:text-dark-50"
            >
              Create label
            </button>
          </div>
        </Form>
      </Formik>
    </>
  );
}

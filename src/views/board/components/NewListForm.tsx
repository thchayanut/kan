import { useState, useEffect } from "react";
import { api } from "~/utils/api";

import { HiXMark } from "react-icons/hi2";
import { Switch } from "@headlessui/react";

import { useBoard } from "~/providers/board";
import { useModal } from "~/providers/modal";

import { Formik, Form, Field } from "formik";

interface FormValues {
  name: string;
}

interface boardPublicId {
  boardPublicId: string;
}

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

export function NewListForm({ boardPublicId }: boardPublicId) {
  const utils = api.useUtils();
  const { boardData } = useBoard();
  const { closeModal } = useModal();
  const [isCreateAnotherEnabled, setIsCreateAnotherEnabled] = useState(false);

  const refetchBoard = () =>
    utils.board.byId.refetch({ id: boardData.publicId });

  const createList = api.list.create.useMutation({
    onSuccess: async () => {
      try {
        await refetchBoard();
        if (!isCreateAnotherEnabled) closeModal();
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    const nameElement: HTMLElement | null =
      document?.querySelector<HTMLElement>("#list-name");
    if (nameElement) nameElement.focus();
  }, []);

  return (
    <>
      <div className="flex w-full items-center justify-between pb-4">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-dark-1000">
          New list
        </h2>
        <button
          className="rounded p-1 hover:bg-light-200 focus:outline-none dark:hover:bg-dark-300"
          onClick={() => closeModal()}
        >
          <HiXMark size={18} className="text-light-900 dark:text-dark-900" />
        </button>
      </div>

      <Formik
        initialValues={{
          name: "",
        }}
        onSubmit={(values: FormValues, { resetForm }) => {
          createList.mutate({
            name: values.name,
            boardPublicId,
          });
          resetForm();
        }}
      >
        <Form>
          <label
            htmlFor="list-name"
            className="block pb-2 text-sm font-normal leading-6 text-neutral-900 dark:text-dark-1000"
          >
            Name
          </label>
          <Field
            id="list-name"
            name="name"
            className="block w-full rounded-md border-0 bg-dark-300 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-600 dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
          />
          <div className="mt-3 flex items-center justify-end">
            <span className="mr-2 text-xs text-light-900 dark:text-dark-900">
              Create more
            </span>
            <Switch
              checked={isCreateAnotherEnabled}
              onChange={setIsCreateAnotherEnabled}
              className={classNames(
                isCreateAnotherEnabled
                  ? "bg-indigo-600"
                  : "bg-light-800 dark:bg-dark-800",
                "relative inline-flex h-4 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              )}
            >
              <span className="sr-only">Create more</span>
              <span
                aria-hidden="true"
                className={classNames(
                  isCreateAnotherEnabled ? "translate-x-2" : "translate-x-0",
                  "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                )}
              />
            </Switch>
          </div>
          <div className="mt-5 sm:mt-6">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 shadow-sm focus-visible:outline-none dark:bg-dark-1000 dark:text-dark-50"
            >
              Create list
            </button>
          </div>
        </Form>
      </Formik>
    </>
  );
}

import { api } from "~/utils/api";

import { HiXMark } from "react-icons/hi2";

import { useModal } from "~/providers/modal";
import { useWorkspace } from "~/providers/workspace";

import { Formik, Form, Field } from "formik";

interface FormValues {
  name: string;
}

export function NewBoardForm() {
  const utils = api.useUtils();
  const { closeModal } = useModal();
  const { workspace } = useWorkspace();

  const refetchBoards = () => utils.board.all.refetch();

  const createBoard = api.board.create.useMutation({
    onSuccess: async () => {
      closeModal();
      await refetchBoards();
    },
  });

  return (
    <>
      <div className="flex w-full items-center justify-between pb-4 text-neutral-900 dark:text-dark-1000">
        <h2 className="text-sm font-bold">New board</h2>
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
        }}
        onSubmit={(values: FormValues) => {
          createBoard.mutate({
            name: values.name,
            workspacePublicId: workspace?.publicId,
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
          <div className="mt-5 sm:mt-6">
            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 shadow-sm focus-visible:outline-none dark:bg-dark-1000 dark:text-dark-50"
            >
              Create board
            </button>
          </div>
        </Form>
      </Formik>
    </>
  );
}

import { Fragment, useState } from "react";
import { api } from "~/utils/api";
import { Listbox, Transition } from "@headlessui/react";

import { FaTrello } from "react-icons/fa";
import { HiChevronUpDown, HiXMark } from "react-icons/hi2";

import { useModal } from "~/providers/modal";
import { useWorkspace } from "~/providers/workspace";

import { useFormik } from "formik";

interface TrelloFormValues {
  apiKey: string;
  token: string;
}

const sources = [{ source: "Trello" }];

const SelectSource = ({ handleNextStep }: { handleNextStep: () => void }) => {
  const formik = useFormik({
    initialValues: {
      source: "Trello",
    },
    onSubmit: () => {
      handleNextStep();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <label
        htmlFor="name"
        className="block pb-2 text-sm font-normal leading-6 text-neutral-900 dark:text-dark-1000"
      >
        Source
      </label>
      <Listbox value={formik.values.source} onChange={formik.handleChange}>
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button className="focus-ring-light-700 block w-full rounded-md border-0 bg-dark-300 bg-white/5 px-4 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6">
                <span className="flex items-center">
                  <FaTrello />
                  <span className="ml-2 block truncate">
                    {formik.values.source}
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
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-light-50 py-1 text-base text-neutral-900 shadow-lg ring-1 ring-light-600 ring-opacity-5 focus:outline-none dark:bg-dark-300 dark:text-dark-1000 sm:text-sm">
                  {sources.map(({ source }, index) => (
                    <Listbox.Option
                      key={`source_${index}`}
                      className="relative cursor-default select-none px-1"
                      value={source}
                    >
                      <div className="flex items-center rounded-[5px] p-1 hover:bg-light-200 dark:hover:bg-dark-400">
                        <FaTrello className="ml-1" />
                        <span className="ml-2 block truncate font-normal">
                          {source}
                        </span>
                      </div>
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
          Select source
        </button>
      </div>
    </form>
  );
};

const ImportTrello: React.FC = () => {
  const utils = api.useUtils();
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const { closeModal } = useModal();
  const { workspace } = useWorkspace();

  const refetchBoards = () => utils.board.all.refetch();

  const boards = api.import.trello.getBoards.useQuery(
    { apiKey, token },
    {
      enabled: apiKey && token ? true : false,
    },
  );

  const handleSetAuthDetails = (apiKey: string, token: string) => {
    setApiKey(apiKey);
    setToken(token);
  };

  const importBoards = api.import.trello.importBoards.useMutation({
    onSuccess: async () => {
      try {
        await refetchBoards();
        closeModal();
      } catch (e) {
        console.log(e);
      }
    },
  });

  const formik = useFormik({
    initialValues: {
      apiKey: "",
      token: "",
    },
    onSubmit: (values: TrelloFormValues) => {
      handleSetAuthDetails(values.apiKey, values.token);
    },
  });

  const boardsFormik = useFormik({
    initialValues: {
      ...Object.fromEntries(
        boards?.data?.map((board) => [board.id, true]) ?? [],
      ),
    },
    onSubmit: () => {
      const boardIds = Object.keys(boardsFormik.values).filter(
        (key) => boardsFormik.values[key] === true,
      );

      importBoards.mutate({
        boardIds,
        apiKey: formik.values.apiKey,
        token: formik.values.token,
        workspacePublicId: workspace?.publicId,
      });
    },
    enableReinitialize: true,
  });

  if (boards?.data?.length)
    return (
      <form onSubmit={boardsFormik.handleSubmit}>
        <div className="h-[105px] overflow-scroll">
          {boards.data.map((board) => (
            <div key={board.id}>
              <div
                className="flex items-center rounded-[5px] p-2 hover:bg-dark-300"
                onClick={async (e) => {
                  e.preventDefault();
                  await boardsFormik.setFieldValue(
                    board.id,
                    !boardsFormik.values[board.id],
                  );
                }}
              >
                <input
                  id={board.id}
                  name={board.id}
                  type="checkbox"
                  className="h-[14px] w-[14px] rounded bg-transparent"
                  onClick={(event) => event.stopPropagation()}
                  checked={boardsFormik.values[board.id]}
                />
                <label
                  htmlFor={board.id}
                  className="ml-3 text-sm text-dark-1000"
                >
                  {board.name}
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 sm:mt-6">
          <button
            type="submit"
            className="inline-flex w-full justify-center rounded-md bg-dark-1000 px-3 py-2 text-sm font-semibold text-dark-50 shadow-sm focus-visible:outline-none"
          >
            Import selected
          </button>
        </div>
      </form>
    );

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="text-neutral-900 dark:text-dark-1000"
    >
      <label
        htmlFor="apiKey"
        className="block pb-2 text-sm font-normal leading-6"
      >
        API Key
      </label>
      <input
        id="apiKey"
        name="apiKey"
        className="mb-2 block w-full rounded-md border-0 bg-dark-300 bg-white/5 py-1.5 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-700 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
        value={formik.values.apiKey}
        onChange={formik.handleChange}
      />
      <label
        htmlFor="token"
        className="block pb-2 text-sm font-normal leading-6"
      >
        Token
      </label>
      <input
        id="token"
        name="token"
        className="mb-2 block w-full rounded-md border-0 bg-dark-300 bg-white/5 py-1.5 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-700 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
        value={formik.values.token}
        onChange={formik.handleChange}
      />
      <div className="mt-5 sm:mt-6">
        <button
          type="submit"
          className="inline-flex w-full justify-center rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 shadow-sm focus-visible:outline-none dark:bg-dark-1000 dark:text-dark-50"
        >
          Fetch boards
        </button>
      </div>
    </form>
  );
};

export function ImportBoardsForm() {
  const { closeModal } = useModal();
  const [step, setStep] = useState(1);

  return (
    <>
      <div className="flex w-full justify-between pb-4">
        <h2 className="text-sm font-medium text-neutral-900 dark:text-dark-1000">
          New import
        </h2>
        <button
          className="rounded p-1 hover:bg-light-200 dark:hover:bg-dark-300"
          onClick={() => closeModal()}
        >
          <HiXMark size={18} className="text-dark-900" />
        </button>
      </div>

      {step === 1 && <SelectSource handleNextStep={() => setStep(step + 1)} />}
      {step === 2 && <ImportTrello />}
    </>
  );
}

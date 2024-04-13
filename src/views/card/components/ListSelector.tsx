import { Fragment } from "react";
import { api } from "~/utils/api";
import { Menu, Transition } from "@headlessui/react";
import { useFormik } from "formik";

interface ListSelectorProps {
  cardPublicId: string;
  lists: {
    publicId: string;
    name: string;
    selected: boolean;
  }[];
}

export default function ListSelector({
  cardPublicId,
  lists,
}: ListSelectorProps) {
  const utils = api.useUtils();

  const refetchCard = () => utils.card.byId.refetch({ id: cardPublicId });

  const updateCardList = api.card.reorder.useMutation({
    onSuccess: async () => {
      await refetchCard();
    },
  });

  const formik = useFormik({
    initialValues: {
      ...Object.fromEntries(
        lists?.map((list) => [list.publicId, list.selected]) ?? [],
      ),
    },
    onSubmit: (values) => {
      console.log({ values });
    },
    enableReinitialize: true,
  });

  const selectedList = lists.find((list) => list.selected);

  return (
    <>
      <Menu
        as="div"
        className="relative flex w-full flex-wrap items-center text-left"
      >
        <Menu.Button className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-200 pl-2 text-left text-sm text-neutral-900 hover:border-light-300 hover:bg-light-300 dark:border-dark-100 dark:text-dark-1000 dark:hover:border-dark-300 dark:hover:bg-dark-200">
          {selectedList?.name}
        </Menu.Button>

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
                {lists?.map((list) => (
                  <Menu.Item key={list.publicId}>
                    <div
                      key={list.publicId}
                      className="flex items-center rounded-[5px] p-2 hover:bg-light-200 dark:hover:bg-dark-300"
                      onClick={async (e) => {
                        e.preventDefault();
                        await formik.setFieldValue(
                          list.publicId,
                          !formik.values[list.publicId],
                        );

                        updateCardList.mutate({
                          cardId: cardPublicId,
                          newListId: list.publicId,
                        });

                        await formik.submitForm();
                      }}
                    >
                      <input
                        id={list.publicId}
                        name={list.publicId}
                        type="checkbox"
                        className="h-[14px] w-[14px] rounded bg-transparent"
                        onClick={(event) => event.stopPropagation()}
                        onChange={formik.handleChange}
                        checked={formik.values[list.publicId]}
                      />
                      <label htmlFor={list.publicId} className="ml-3 text-sm">
                        {list.name}
                      </label>
                    </div>
                  </Menu.Item>
                ))}
              </form>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}

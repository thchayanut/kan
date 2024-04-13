import { Fragment } from "react";
import { api } from "~/utils/api";
import { Menu, Transition } from "@headlessui/react";
import { HiMiniPlus } from "react-icons/hi2";
import { useFormik } from "formik";

interface MemberSelectorProps {
  cardPublicId: string;
  members: {
    publicId: string;
    user: {
      id: string;
      name: string | null;
    };
    selected: boolean;
  }[];
}

export default function LabelSelector({
  cardPublicId,
  members,
}: MemberSelectorProps) {
  const utils = api.useUtils();

  const refetchCard = () => utils.card.byId.refetch({ id: cardPublicId });

  const addOrRemoveMember = api.card.addOrRemoveMember.useMutation({
    onSuccess: async () => {
      await refetchCard();
    },
  });

  const formik = useFormik({
    initialValues: {
      ...Object.fromEntries(
        members?.map((member) => [member.publicId, member.selected]) ?? [],
      ),
    },
    onSubmit: (values) => {
      console.log({ values });
    },
    enableReinitialize: true,
  });

  const selectedMembers = members.filter((member) => member.selected);

  return (
    <>
      <Menu
        as="div"
        className="relative flex w-full flex-wrap items-center text-left"
      >
        <Menu.Button className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-200 pl-2 text-left text-sm text-neutral-900 hover:bg-light-300 dark:border-dark-100 dark:text-dark-1000 dark:hover:border-dark-300 dark:hover:bg-dark-200">
          {selectedMembers.length ? (
            <div className="isolate flex -space-x-1 overflow-hidden">
              {selectedMembers.map((member) => (
                <span
                  key={member.publicId}
                  className="relative z-30 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 ring-1 ring-light-200 dark:ring-dark-100"
                >
                  <span className="text-[10px] font-medium leading-none text-white">
                    {member.user?.name
                      ? member.user?.name
                          .split(" ")
                          .map((namePart) => namePart.charAt(0).toUpperCase())
                          .join("")
                      : null}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <>
              <HiMiniPlus size={22} className="pr-2" />
              {"Add member"}
            </>
          )}
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
                {members?.map((member) => (
                  <Menu.Item key={member.publicId}>
                    <div
                      key={member.publicId}
                      className="flex items-center rounded-[5px] p-2 hover:bg-light-200 dark:hover:bg-dark-300"
                      onClick={async (e) => {
                        e.preventDefault();
                        await formik.setFieldValue(
                          member.publicId,
                          !formik.values[member.publicId],
                        );

                        addOrRemoveMember.mutate({
                          cardPublicId,
                          workspaceMemberPublicId: member.publicId,
                        });

                        await formik.submitForm();
                      }}
                    >
                      <input
                        id={member.publicId}
                        name={member.publicId}
                        type="checkbox"
                        className="h-[14px] w-[14px] rounded bg-transparent"
                        onClick={(event) => event.stopPropagation()}
                        onChange={formik.handleChange}
                        checked={formik.values[member.publicId]}
                      />
                      <label htmlFor={member.publicId} className="ml-3 text-sm">
                        {member?.user?.name}
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

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";

import { HiXMark } from "react-icons/hi2";
import { Switch } from "@headlessui/react";

import CheckboxDropdown from "~/components/CheckboxDropdown";
import { useBoard } from "~/providers/board";
import { useModal } from "~/providers/modal";

interface FormData {
  title: string;
  listPublicId: string;
  labelPublicIds: string[];
  memberPublicIds: string[];
  isCreateAnotherEnabled: boolean;
}

interface NewCardFormProps {
  listPublicId: string;
}

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}

export function NewCardForm({ listPublicId }: NewCardFormProps) {
  const utils = api.useUtils();
  const { boardData } = useBoard();
  const { closeModal } = useModal();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      title: "",
      listPublicId,
      labelPublicIds: [],
      memberPublicIds: [],
      isCreateAnotherEnabled: false,
    },
  });

  const labelPublicIds = watch("labelPublicIds") || [];
  const memberPublicIds = watch("memberPublicIds") || [];
  const isCreateAnotherEnabled = watch("isCreateAnotherEnabled");

  const refetchBoard = () =>
    utils.board.byId.refetch({ id: boardData.publicId });

  const createCard = api.card.create.useMutation({
    onSuccess: async () => {
      try {
        await refetchBoard();
        if (!isCreateAnotherEnabled) closeModal();
        reset({
          title: "",
          listPublicId: watch("listPublicId"),
          labelPublicIds: [],
          memberPublicIds: [],
          isCreateAnotherEnabled: watch("isCreateAnotherEnabled"),
        });
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    const titleElement: HTMLElement | null =
      document?.querySelector<HTMLElement>("#title");
    if (titleElement) titleElement.focus();
  }, []);

  const formattedLabels =
    boardData?.labels.map((label) => ({
      key: label.publicId,
      value: label.name,
      selected: labelPublicIds.includes(label.publicId),
    })) ?? [];

  const formattedLists =
    boardData?.lists.map((list) => ({
      key: list.publicId,
      value: list.name,
      selected: list.publicId === watch("listPublicId"),
    })) ?? [];

  const formattedMembers =
    boardData?.workspace?.members?.map((member) => ({
      key: member.publicId,
      value: member.user?.name ?? "",
      selected: memberPublicIds.includes(member.publicId),
    })) ?? [];

  const onSubmit = (data: FormData) => {
    createCard.mutate({
      title: data.title,
      listPublicId: data.listPublicId,
      labelsPublicIds: data.labelPublicIds,
      memberPublicIds: data.memberPublicIds,
    });
  };

  const handleToggleCreateAnother = (): void => {
    setValue("isCreateAnotherEnabled", !isCreateAnotherEnabled);
  };

  const handleSelectList = (listPublicId: string): void => {
    setValue("listPublicId", listPublicId);
  };

  const handleSelectMembers = (memberPublicId: string): void => {
    const currentIndex = memberPublicIds.indexOf(memberPublicId);
    if (currentIndex === -1) {
      setValue("memberPublicIds", [...memberPublicIds, memberPublicId]);
    } else {
      const newMemberPublicIds = [...memberPublicIds];
      newMemberPublicIds.splice(currentIndex, 1);
      setValue("memberPublicIds", newMemberPublicIds);
    }
  };

  const handleSelectLabels = (labelPublicId: string): void => {
    const currentIndex = labelPublicIds.indexOf(labelPublicId);
    if (currentIndex === -1) {
      setValue("labelPublicIds", [...labelPublicIds, labelPublicId]);
    } else {
      const newLabelPublicIds = [...labelPublicIds];
      newLabelPublicIds.splice(currentIndex, 1);
      setValue("labelPublicIds", newLabelPublicIds);
    }
  };

  const selectedList = formattedLists.find((item) => item.selected);

  return (
    <>
      <div className="flex w-full items-center justify-between pb-4">
        <h2 className="text-sm font-bold text-neutral-900 dark:text-dark-1000">
          New card
        </h2>
        <button
          className="rounded p-1 hover:bg-light-200 focus:outline-none dark:hover:bg-dark-300"
          onClick={() => closeModal()}
        >
          <HiXMark size={18} className="text-light-900 dark:text-dark-900" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="title"
            className="block pb-2 text-sm font-normal leading-6 text-neutral-900 dark:text-dark-1000"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="block w-full rounded-md border-0 bg-dark-300 bg-white/5 py-1.5 text-neutral-900 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-600 dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
          />
        </div>
        <div className="mt-2 flex space-x-1">
          <div className="w-fit">
            <CheckboxDropdown
              items={formattedLists}
              handleSelect={(list: { key: string }) =>
                handleSelectList(list.key)
              }
            >
              <div className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-600 bg-light-200 px-2 py-1 text-left text-xs text-light-800 hover:bg-light-300 dark:border-dark-600 dark:bg-dark-400 dark:text-dark-1000 dark:hover:bg-dark-500">
                {selectedList?.value}
              </div>
            </CheckboxDropdown>
          </div>
          <div className="w-fit">
            <CheckboxDropdown
              items={formattedMembers}
              handleSelect={(list: { key: string }) =>
                handleSelectMembers(list.key)
              }
            >
              <div className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-600 bg-light-200 px-2 py-1 text-left text-xs text-light-800 hover:bg-light-300 dark:border-dark-600 dark:bg-dark-400 dark:text-dark-1000 dark:hover:bg-dark-500">
                {!memberPublicIds.length ? (
                  "Members"
                ) : (
                  <div className="flex -space-x-1 overflow-hidden">
                    {memberPublicIds.map((memberPublicId) => {
                      const member = formattedMembers.find(
                        (member) => member.key === memberPublicId,
                      );

                      return (
                        <span
                          key={member?.key}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-400 ring-1 ring-light-200 dark:ring-dark-500"
                        >
                          <span className="text-[8px] font-medium leading-none text-white">
                            {member?.value
                              ?.split(" ")
                              .map((namePart) =>
                                namePart.charAt(0).toUpperCase(),
                              )
                              .join("")}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </CheckboxDropdown>
          </div>
          <div className="w-fit">
            <CheckboxDropdown
              items={formattedLabels}
              handleSelect={(list: { key: string }) =>
                handleSelectLabels(list.key)
              }
            >
              <div className="flex h-full w-full items-center rounded-[5px] border-[1px] border-light-600 bg-light-200 px-2 py-1 text-left text-xs text-light-800 hover:bg-light-300 dark:border-dark-600 dark:bg-dark-400 dark:text-dark-1000 dark:hover:bg-dark-500">
                {!labelPublicIds.length ? (
                  "Labels"
                ) : (
                  <>
                    <div
                      className={
                        labelPublicIds.length > 1
                          ? "flex -space-x-[2px] overflow-hidden"
                          : "flex items-center"
                      }
                    >
                      {labelPublicIds.map((labelPublicId) => {
                        const label = boardData?.labels.find(
                          (label) => label.publicId === labelPublicId,
                        );

                        return (
                          <>
                            <svg
                              fill={label?.colourCode ?? "#3730a3"}
                              className="h-2 w-2"
                              viewBox="0 0 6 6"
                              aria-hidden="true"
                            >
                              <circle cx={3} cy={3} r={3} />
                            </svg>
                            {labelPublicIds.length === 1 && (
                              <div className="ml-1">{label?.name}</div>
                            )}
                          </>
                        );
                      })}
                    </div>
                    {labelPublicIds.length > 1 && (
                      <div className="ml-1">{`${labelPublicIds.length} labels`}</div>
                    )}
                  </>
                )}
              </div>
            </CheckboxDropdown>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <span className="mr-2 text-xs text-light-900 dark:text-dark-900">
            Create more
          </span>
          <Switch
            checked={isCreateAnotherEnabled}
            onChange={handleToggleCreateAnother}
            className={classNames(
              isCreateAnotherEnabled
                ? "bg-indigo-600"
                : "bg-light-800 dark:bg-dark-800",
              "relative inline-flex h-4 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            )}
          >
            <span className="sr-only">Create another</span>
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
            Create card
          </button>
        </div>
      </form>
    </>
  );
}

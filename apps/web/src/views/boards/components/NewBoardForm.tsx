import { useForm } from "react-hook-form";
import { HiXMark } from "react-icons/hi2";

import type { NewBoardInput } from "@kan/api/types";

import Button from "~/components/Button";
import { useModal } from "~/providers/modal";
import { useWorkspace } from "~/providers/workspace";
import { api } from "~/utils/api";

export function NewBoardForm() {
  const utils = api.useUtils();
  const { closeModal } = useModal();
  const { workspace } = useWorkspace();

  const { register, handleSubmit } = useForm<NewBoardInput>({
    defaultValues: {
      name: "",
      workspacePublicId: workspace.publicId || "",
    },
  });

  const refetchBoards = () => utils.board.all.refetch();

  const createBoard = api.board.create.useMutation({
    onSuccess: async () => {
      closeModal();
      await refetchBoards();
    },
  });

  const onSubmit = (data: NewBoardInput) => {
    createBoard.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="px-5 pt-5">
        <div className="text-neutral-9000 flex w-full items-center justify-between pb-4 dark:text-dark-1000">
          <h2 className="text-sm font-bold">New board</h2>
          <button
            type="button"
            className="hover:bg-li ght-300 rounded p-1 focus:outline-none dark:hover:bg-dark-300"
            onClick={(e) => {
              e.preventDefault();
              closeModal();
            }}
          >
            <HiXMark size={18} className="dark:text-dark-9000 text-light-900" />
          </button>
        </div>
        <input
          id="name"
          placeholder="Name"
          {...register("name", { required: true })}
          className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-neutral-900 placeholder-dark-800 shadow-sm ring-1 ring-inset ring-light-600 focus:ring-2 focus:ring-inset focus:ring-light-600 dark:bg-dark-300 dark:text-dark-1000 dark:ring-dark-700 dark:focus:ring-dark-700 sm:text-sm sm:leading-6"
        />
      </div>

      <div className="mt-12 flex items-center justify-end border-t border-light-600 px-5 pb-5 pt-5 dark:border-dark-600">
        <div>
          <Button type="submit" isLoading={createBoard.isPending}>
            Create board
          </Button>
        </div>
      </div>
    </form>
  );
}

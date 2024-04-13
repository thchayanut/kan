import { useRouter } from "next/navigation";

import { api } from "~/utils/api";
import { useBoard } from "~/providers/board";
import { useModal } from "~/providers/modal";

export function DeleteBoardConfirmation() {
  const router = useRouter();
  const { boardData } = useBoard();
  const { closeModal } = useModal();

  const deleteBoard = api.board.delete.useMutation({
    onSuccess: () => {
      closeModal();
      router.push(`/boards`);
    },
  });

  return (
    <>
      <div className="flex w-full flex-col justify-between pb-4">
        <h2 className="text-md pb-4 font-medium text-neutral-900 dark:text-dark-1000">
          Are you sure you want to delete this board?
        </h2>
        <p className="text-sm font-medium text-light-900 dark:text-dark-900">
          {"This action can't be undone."}
        </p>
      </div>
      <div className="mt-5 flex justify-end sm:mt-6">
        <button
          className="mr-4 inline-flex justify-center rounded-md border-[1px] border-light-600 bg-light-50 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm focus-visible:outline-none dark:border-dark-600 dark:bg-dark-300 dark:text-dark-1000"
          onClick={() => closeModal()}
        >
          Cancel
        </button>
        <button
          onClick={() =>
            deleteBoard.mutate({
              boardPublicId: boardData.publicId,
            })
          }
          className="inline-flex justify-center rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 shadow-sm focus-visible:outline-none dark:bg-dark-1000 dark:text-dark-50"
        >
          Delete
        </button>
      </div>
    </>
  );
}

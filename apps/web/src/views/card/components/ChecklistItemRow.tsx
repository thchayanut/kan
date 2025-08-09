import { t } from "@lingui/core/macro";
import { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import { HiXMark } from "react-icons/hi2";

import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";

interface ChecklistItemRowProps {
  item: {
    publicId: string;
    title: string;
    completed: boolean;
  };
  cardPublicId: string;
}

export default function ChecklistItemRow({
  item,
  cardPublicId,
}: ChecklistItemRowProps) {
  const utils = api.useUtils();
  const { showPopup } = usePopup();

  const updateItem = api.checklist.updateItem.useMutation({
    onMutate: async (vars) => {
      await utils.card.byId.cancel({ cardPublicId });
      const previous = utils.card.byId.getData({ cardPublicId });
      utils.card.byId.setData({ cardPublicId }, (old) => {
        if (!old) return old as any;
        const updatedChecklists = old.checklists.map((cl) => ({
          ...cl,
          items: cl.items.map((ci) =>
            ci.publicId === item.publicId
              ? {
                  ...ci,
                  ...(vars.title !== undefined ? { title: vars.title } : {}),
                  ...(vars.completed !== undefined
                    ? { completed: vars.completed }
                    : {}),
                }
              : ci,
          ),
        }));
        return { ...old, checklists: updatedChecklists } as typeof old;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        utils.card.byId.setData({ cardPublicId }, ctx.previous);
      showPopup({
        header: t`Unable to update checklist item`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
    onSettled: async () => {
      await utils.card.byId.invalidate({ cardPublicId });
    },
  });

  const deleteItem = api.checklist.deleteItem.useMutation({
    onMutate: async () => {
      await utils.card.byId.cancel({ cardPublicId });
      const previous = utils.card.byId.getData({ cardPublicId });
      utils.card.byId.setData({ cardPublicId }, (old) => {
        if (!old) return old as any;
        const updatedChecklists = old.checklists.map((cl) => ({
          ...cl,
          items: cl.items.filter((ci) => ci.publicId !== item.publicId),
        }));
        return { ...old, checklists: updatedChecklists } as typeof old;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        utils.card.byId.setData({ cardPublicId }, ctx.previous);
      showPopup({
        header: t`Unable to delete checklist item`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
    onSettled: async () => {
      await utils.card.byId.invalidate({ cardPublicId });
    },
  });

  const [title, setTitle] = useState(item.title);
  const [completed, setCompleted] = useState(item.completed);

  useEffect(() => {
    setTitle(item.title);
    setCompleted(item.completed);
  }, [item.publicId, item.title, item.completed]);

  const handleToggleCompleted = () => {
    setCompleted((prev) => !prev);
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      completed: !completed,
    });
  };

  const commitTitle = async () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === item.title) return;
    updateItem.mutate({
      checklistItemPublicId: item.publicId,
      title: trimmed,
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ checklistItemPublicId: item.publicId });
  };

  return (
    <div className="group relative flex h-9 items-center gap-3 rounded-md pl-4 hover:bg-light-100 dark:hover:bg-dark-100">
      <label className="relative inline-flex h-[16px] w-[16px] flex-shrink-0 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={completed}
          onChange={handleToggleCompleted}
          className="peer h-[16px] w-[16px] appearance-none rounded-full border border-light-500 bg-transparent outline-none ring-0 checked:bg-indigo-600 hover:border-light-500 hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none dark:border-dark-500 dark:hover:border-dark-500"
        />
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 text-white peer-checked:block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10.5l3 3 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </label>
      <div className="flex-1 pr-7">
        <ContentEditable
          html={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className="m-0 min-h-[20px] w-full p-0 text-[14px] leading-[20px] text-light-900 outline-none focus-visible:outline-none dark:text-dark-1000"
          placeholder={t`Add details...`}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              await commitTitle();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setTitle(item.title);
            }
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleDelete}
        className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-light-900 group-hover:block hover:bg-light-200 dark:text-dark-700 dark:hover:bg-dark-200"
      >
        <HiXMark size={16} />
      </button>
    </div>
  );
}

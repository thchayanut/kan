import { t } from "@lingui/core/macro";
import ContentEditable from "react-contenteditable";
import { useForm } from "react-hook-form";

import Button from "~/components/Button";
import { usePopup } from "~/providers/popup";
import { api } from "~/utils/api";

interface FormValues {
  title: string;
}

interface NewChecklistItemFormProps {
  checklistPublicId: string;
  cardPublicId: string;
  onCancel: () => void;
}

const NewChecklistItemForm = ({
  checklistPublicId,
  cardPublicId,
  onCancel,
}: NewChecklistItemFormProps) => {
  const utils = api.useUtils();
  const { showPopup } = usePopup();

  const { handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      title: "",
    },
  });

  const title = watch("title");

  const addChecklistItemMutation = api.checklist.createItem.useMutation({
    onError: (_error, _newItem) => {
      showPopup({
        header: t`Unable to add checklist item`,
        message: t`Please try again later, or contact customer support.`,
        icon: "error",
      });
    },
    onSettled: async () => {
      await utils.card.byId.invalidate({ cardPublicId });
    },
    onSuccess: async () => {
      reset();
      await utils.card.byId.refetch({ cardPublicId });
    },
  });

  const onSubmit = (data: FormValues) => {
    addChecklistItemMutation.mutate({
      checklistPublicId,
      title: data.title,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-2 w-full rounded-xl border border-light-600 bg-light-100 p-4 text-light-900 focus-visible:outline-none dark:border-dark-400 dark:bg-dark-100 dark:text-dark-1000"
    >
      <div className="mb-3">
        <ContentEditable
          placeholder={t`Add an item...`}
          html={title}
          disabled={false}
          onChange={(e) => setValue("title", e.target.value)}
          className="block w-full border-0 bg-transparent py-1.5 text-light-900 focus-visible:outline-none dark:text-dark-1000 sm:text-sm sm:leading-6"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              await handleSubmit(onSubmit)();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      </div>

      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          <Button size="xs" type="button" variant="ghost" onClick={onCancel}>
            {t`Cancel`}
          </Button>
          <Button
            size="xs"
            type="submit"
            variant="secondary"
            disabled={title.length === 0 || addChecklistItemMutation.isPending}
          >
            {t`Add`}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default NewChecklistItemForm;

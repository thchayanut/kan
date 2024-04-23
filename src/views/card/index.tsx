import Link from "next/link";
import { useParams } from "next/navigation";
import { useFormik } from "formik";
import ContentEditable from "react-contenteditable";
import { IoChevronForwardSharp } from "react-icons/io5";

import Dropdown from "./components/Dropdown";
import { DeleteCardConfirmation } from "./components/DeleteCardConfirmation";
import LabelSelector from "./components/LabelSelector";
import ListSelector from "./components/ListSelector";
import MemberSelector from "./components/MemberSelector";
import { NewLabelForm } from "./components/NewLabelForm";
import { NewWorkspaceForm } from "~/components/NewWorkspaceForm";

import Modal from "~/components/modal";
import { useModal } from "~/providers/modal";

import { api } from "~/utils/api";

interface FormValues {
  cardId: string;
  title: string;
  description: string;
}

export default function CardPage() {
  const params = useParams();
  const { modalContentType } = useModal();

  const cardId = Array.isArray(params?.cardId)
    ? params.cardId[0]
    : params?.cardId;

  const { data, error } = api.card.byId.useQuery({ id: cardId ?? "" });

  const board = data?.list?.board;
  const boardId = board?.publicId;
  const labels = board?.labels;
  const workspaceMembers = board?.workspace?.members;
  const selectedLabels = data?.labels;
  const selectedMembers = data?.members;

  console.log({ board: error });

  const formattedLabels =
    labels?.map((label) => {
      const isSelected = selectedLabels?.some(
        (selectedLabel) => selectedLabel.publicId === label.publicId,
      );

      return {
        ...label,
        selected: isSelected ?? false,
        colourCode: label.colourCode ?? "",
      };
    }) ?? [];

  const formattedLists =
    board?.lists.map((list) => ({
      ...list,
      selected: list.publicId === data?.list?.publicId,
    })) ?? [];

  const formattedMembers =
    workspaceMembers?.map((member) => {
      const isSelected = selectedMembers?.some(
        (assignedMember) => assignedMember.publicId === member.publicId,
      );

      return {
        ...member,
        user: member.user ?? { id: "", name: null },
        selected: isSelected ?? false,
      };
    }) ?? [];

  const updateCard = api.card.update.useMutation();

  const formik = useFormik({
    initialValues: {
      cardId: cardId ?? "",
      title: data?.title ? data.title : "",
      description: data?.description ? data.description : "",
    },
    onSubmit: (values: FormValues) => {
      updateCard.mutate({
        cardId: values.cardId,
        title: values.title,
        description: values.description,
      });
    },
    enableReinitialize: true,
  });

  if (!cardId) return <></>;

  return (
    <div className="flex h-full flex-1 flex-row">
      <div className="w-full p-8">
        <div className="mb-8 flex w-full items-center justify-between">
          <Link
            className="whitespace-nowrap font-medium leading-[2.3rem] tracking-tight text-light-900 dark:text-dark-900 sm:text-[1.2rem]"
            href={`/boards/${board?.publicId}`}
          >
            {board?.name}
          </Link>
          <IoChevronForwardSharp
            size={18}
            className="mx-2 text-light-900 dark:text-dark-900"
          />
          <form onSubmit={formik.handleSubmit} className="w-full space-y-6">
            <div>
              <input
                type="text"
                id="title"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.submitForm}
                className="block w-full border-0 bg-transparent p-0 py-0 font-medium tracking-tight text-neutral-900 focus:ring-0 dark:text-dark-1000 sm:text-[1.2rem]"
              />
            </div>
          </form>
          <div className="flex">
            <Dropdown />
          </div>
        </div>
        <div className="mb-8 flex w-full max-w-2xl justify-between">
          <form onSubmit={formik.handleSubmit} className="w-full space-y-6">
            <div className="mt-2">
              <ContentEditable
                placeholder="Add description..."
                html={formik.values.description}
                disabled={false}
                onChange={(e) =>
                  formik.setFieldValue("description", e.target.value)
                }
                onBlur={formik.submitForm}
                className="block w-full border-0 bg-transparent py-1.5 text-light-900 focus-visible:outline-none dark:text-dark-1000 sm:text-sm sm:leading-6"
              />
            </div>
          </form>
        </div>
      </div>
      <div className="min-w-[325px] border-l-[1px] border-light-600 bg-light-200 p-8 text-light-900 dark:border-dark-400 dark:bg-dark-100 dark:text-dark-900">
        <div className="mb-4 flex w-full">
          <p className="my-2 w-[100px] text-sm">List</p>
          <ListSelector cardPublicId={cardId} lists={formattedLists} />
        </div>
        <div className="mb-4 flex w-full">
          <p className="my-2 w-[100px] text-sm">Labels</p>
          <LabelSelector cardPublicId={cardId} labels={formattedLabels} />
        </div>
        <div className="flex w-full">
          <p className="my-2 w-[100px] text-sm">Members</p>
          <MemberSelector cardPublicId={cardId} members={formattedMembers} />
        </div>
      </div>

      <Modal>
        {modalContentType === "NEW_LABEL" && (
          <NewLabelForm cardPublicId={cardId} />
        )}
        {modalContentType === "DELETE_CARD" && (
          <DeleteCardConfirmation
            boardPublicId={boardId ?? ""}
            cardPublicId={cardId}
          />
        )}
        {modalContentType === "NEW_WORKSPACE" && <NewWorkspaceForm />}
      </Modal>
    </div>
  );
}

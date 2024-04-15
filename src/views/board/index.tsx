import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HiOutlinePlusSmall } from "react-icons/hi2";
import {
  DragDropContext,
  Droppable,
  type DropResult,
  Draggable,
} from "react-beautiful-dnd";
import { useFormik } from "formik";

import { api } from "~/utils/api";
import { useBoard } from "~/providers/board";
import { useModal } from "~/providers/modal";

import Modal from "~/components/modal";

import BoardDropdown from "./components/BoardDropdown";
import { DeleteBoardConfirmation } from "./components/DeleteBoardConfirmation";
import { DeleteListConfirmation } from "./components/DeleteListConfirmation";
import List from "./components/List";
import { NewWorkspaceForm } from "~/components/NewWorkspaceForm";
import { NewCardForm } from "./components/NewCardForm";
import { NewListForm } from "./components/NewListForm";

interface List {
  publicId: string;
  name: string;
  cards?: Card[];
}

interface Card {
  publicId: string;
  title: string;
  labels?: Label[];
  members?: Member[];
}

interface Label {
  publicId: string;
  name: string;
  colourCode: string;
}

interface Member {
  publicId: string;
  user: User;
}

interface User {
  name: string;
}

interface FormValues {
  boardId: string;
  name: string;
}

type PublicListId = string;

export default function BoardPage() {
  const params = useParams();
  const { boardData, setBoardData, updateCard, updateList } = useBoard();
  const { openModal, modalContentType } = useModal();
  const [selectedPublicListId, setSelectedPublicListId] =
    useState<PublicListId>("");

  console.log({ boardData });

  const boardId = params?.boardId?.length ? params.boardId[0] : null;

  const updateBoard = api.board.update.useMutation();

  const formik = useFormik({
    initialValues: {
      boardId: boardId ?? "",
      name: boardData?.name ? boardData.name : "",
    },
    onSubmit: (values: FormValues) => {
      updateBoard.mutate({
        boardId: values.boardId,
        name: values.name,
      });
    },
    enableReinitialize: true,
  });

  const { data, isSuccess } = api.board.byId.useQuery(
    { id: boardId ?? "" },
    {
      enabled: !!boardId,
    },
  );

  if (isSuccess && data) {
    console.log({ data });
    setBoardData(data);
  }

  if (!boardId) return <></>;

  const openNewListForm = (publicBoardId: string) => {
    openModal("NEW_LIST");
    setSelectedPublicListId(publicBoardId);
  };

  const onDragEnd = ({
    source,
    destination,
    draggableId,
    type,
  }: DropResult): void => {
    if (!destination) {
      return;
    }

    if (type === "LIST") {
      const updatedLists = Array.from(boardData.lists);
      const removedList = updatedLists.splice(source.index, 1)[0];

      if (removedList) {
        updatedLists.splice(destination.index, 0, removedList);

        setBoardData({ ...boardData, lists: updatedLists });
      }

      updateList({
        boardId,
        listId: draggableId,
        currentIndex: source.index,
        newIndex: destination.index,
      });
    }

    if (type === "CARD") {
      const updatedLists = Array.from(boardData.lists);
      const sourceList = updatedLists.find(
        (list) => list.publicId === source.droppableId,
      );
      const destinationList = updatedLists.find(
        (list) => list.publicId === destination.droppableId,
      );
      const removedCard = sourceList?.cards.splice(source.index, 1)[0];

      if (sourceList && destinationList && removedCard) {
        destinationList.cards.splice(destination.index, 0, removedCard);

        setBoardData({ ...boardData, lists: updatedLists });
      }

      updateCard({
        cardId: draggableId,
        newListId: destination.droppableId,
        newIndex: destination.index,
      });
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <div>
        <svg
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: "0px",
            left: "0px",
            color: "white",
          }}
        >
          <pattern
            id="pattern"
            x="0.034759358288862785"
            y="3.335370511841166"
            width="14.423223834988539"
            height="14.423223834988539"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(-0.45072574484339184,-0.45072574484339184)"
          >
            <circle
              cx="0.45072574484339184"
              cy="0.45072574484339184"
              r="0.45072574484339184"
              fill="#3e3e3e"
            ></circle>
          </pattern>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#pattern)"
          ></rect>
        </svg>
      </div>

      <div className="z-20 flex w-full justify-between p-8 ">
        <form
          onSubmit={formik.handleSubmit}
          className="focus-visible:outline-none"
        >
          <input
            type="name"
            id="name"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.submitForm}
            className="block border-0 bg-transparent p-0 py-0 font-medium leading-[2.3rem] tracking-tight text-neutral-900 focus:ring-0 focus-visible:outline-none dark:text-dark-1000 sm:text-[1.2rem]"
          />
        </form>
        <div className="flex items-center">
          <button
            type="button"
            className="mr-2 inline-flex items-center gap-x-1.5 rounded-md bg-light-1000 px-3 py-2 text-sm font-semibold text-light-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-dark-1000 dark:text-dark-50"
            onClick={() => openNewListForm(boardId)}
          >
            <HiOutlinePlusSmall
              className="-mr-0.5 h-5 w-5"
              aria-hidden="true"
            />
            New list
          </button>
          <BoardDropdown />
        </div>
      </div>

      <div className="scrollbar-w-none z-10 flex-1 overflow-y-hidden overflow-x-scroll overscroll-contain pb-5 scrollbar scrollbar-track-light-200 scrollbar-thumb-light-400 scrollbar-track-rounded-[4px] scrollbar-thumb-rounded-[4px] scrollbar-h-[8px] dark:scrollbar-track-dark-100 dark:scrollbar-thumb-dark-300">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="LIST">
            {(provided) => (
              <div
                className="flex"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <div className="min-w-[2rem]" />
                {boardData?.lists?.map((list: List, index) => (
                  <List
                    index={index}
                    key={index}
                    list={list}
                    setSelectedPublicListId={(publicListId) =>
                      setSelectedPublicListId(publicListId)
                    }
                  >
                    <Droppable droppableId={`${list.publicId}`} type="CARD">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="h-full max-h-[calc(100vh-250px)] min-h-[2rem] overflow-y-auto pr-1 scrollbar scrollbar-track-dark-100 scrollbar-thumb-dark-600 scrollbar-track-rounded-[4px] scrollbar-thumb-rounded-[4px] scrollbar-w-[8px]"
                        >
                          {list.cards?.map((card, index) => (
                            <Draggable
                              key={card.publicId}
                              draggableId={card.publicId}
                              index={index}
                            >
                              {(provided) => (
                                <Link
                                  key={card.publicId}
                                  href={`/cards/${card.publicId}`}
                                  className="mb-2 flex !cursor-pointer flex-col rounded-md border border-light-200 bg-light-50 px-3 py-2 text-sm text-neutral-900 dark:border-dark-200 dark:bg-dark-500 dark:text-dark-1000"
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <div>{card.title}</div>
                                  {(card.labels?.length ?? 0) ||
                                  (card.members?.length ?? 0) ? (
                                    <div className="mt-2 flex justify-end space-x-1">
                                      {card.labels?.map((label) => (
                                        <span
                                          key={label.publicId}
                                          className="inline-flex w-fit items-center gap-x-1.5 rounded-full px-2 py-1 text-[10px] font-medium text-neutral-600 ring-1 ring-inset ring-light-600 dark:text-dark-1000 dark:ring-dark-800"
                                        >
                                          <svg
                                            fill={label.colourCode}
                                            className="h-2 w-2"
                                            viewBox="0 0 6 6"
                                            aria-hidden="true"
                                          >
                                            <circle cx={3} cy={3} r={3} />
                                          </svg>
                                          <div>{label.name}</div>
                                        </span>
                                      ))}
                                      <div className="isolate flex -space-x-1 overflow-hidden">
                                        {card.members?.map((member) => (
                                          <span
                                            key={member.publicId}
                                            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-light-900 ring-2 ring-light-50 dark:bg-gray-500 dark:ring-dark-500"
                                          >
                                            <span className="text-[10px] font-medium leading-none text-white">
                                              {member.user.name
                                                .split(" ")
                                                .map((namePart) =>
                                                  namePart
                                                    .charAt(0)
                                                    .toUpperCase(),
                                                )
                                                .join("")}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </Link>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </List>
                ))}
                <div className="min-w-[0.75rem]" />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <Modal>
        {modalContentType === "DELETE_BOARD" && <DeleteBoardConfirmation />}
        {modalContentType === "DELETE_LIST" && (
          <DeleteListConfirmation listPublicId={selectedPublicListId} />
        )}
        {modalContentType === "NEW_CARD" && (
          <NewCardForm listPublicId={selectedPublicListId} />
        )}
        {modalContentType === "NEW_LIST" && (
          <NewListForm boardPublicId={boardId} />
        )}
        {modalContentType === "NEW_WORKSPACE" && <NewWorkspaceForm />}
      </Modal>
    </div>
  );
}

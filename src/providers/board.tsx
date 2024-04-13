import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import { api } from "~/utils/api";

interface BoardContextProps {
  boardData: BoardData;
  setBoardData: React.Dispatch<React.SetStateAction<BoardData>>;
  updateList: (params: UpdateListParams) => void;
  updateCard: (params: UpdateCardParams) => void;
}

interface BoardData {
  name: string;
  publicId: string;
  labels: Label[];
  lists: List[];
  workspace: {
    members: Members[];
  } | null;
}

interface Label {
  publicId: string;
  name: string;
  colourCode: string | null;
}

interface List {
  publicId: string;
  name: string;
  boardId: number;
  index: number;
  cards: Card[];
}

interface Members {
  publicId: string;
  user: {
    name: string | null;
  } | null;
}

interface Card {
  publicId: string;
  title: string;
}

interface UpdateListParams {
  boardId: string;
  listId: string;
  currentIndex: number;
  newIndex: number;
}

interface UpdateCardParams {
  cardId: string;
  newListId: string;
  newIndex: number;
}

const initialBoardData: BoardData = {
  name: "",
  publicId: "",
  lists: [],
  labels: [],
  workspace: {
    members: [],
  },
};

const BoardContext = createContext<BoardContextProps | undefined>(undefined);

export const BoardProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const utils = api.useUtils();
  const [boardData, setBoardData] = useState<BoardData>(initialBoardData);

  const refetchBoard = () =>
    utils.board.byId.refetch({ id: boardData.publicId });

  const updateCardMutation = api.card.reorder.useMutation({
    onSuccess: async () => {
      try {
        await refetchBoard();
      } catch (e) {
        console.log(e);
      }
    },
  });

  const updateListMutation = api.list.reorder.useMutation({
    onSuccess: async () => {
      try {
        await refetchBoard();
      } catch (e) {
        console.log(e);
      }
    },
  });

  const updateList = ({
    boardId,
    listId,
    currentIndex,
    newIndex,
  }: UpdateListParams) => {
    updateListMutation.mutate({
      boardId,
      listId,
      currentIndex,
      newIndex,
    });
  };

  const updateCard = ({ cardId, newListId, newIndex }: UpdateCardParams) => {
    updateCardMutation.mutate({
      cardId,
      newListId,
      newIndex,
    });
  };

  return (
    <BoardContext.Provider
      value={{ boardData, setBoardData, updateList, updateCard }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = (): BoardContextProps => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
};

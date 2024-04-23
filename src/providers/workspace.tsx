import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api } from "~/utils/api";

import { useRouter } from "next/navigation";

interface WorkspaceContextProps {
  workspace: Workspace;
  switchWorkspace: (_workspace: Workspace) => void;
  availableWorkspaces: Workspace[];
}

interface Workspace {
  name: string;
  publicId: string;
}

const initialWorkspace: Workspace = {
  name: "",
  publicId: "",
};

const initialAvailableWorkspaces: Workspace[] = [];

const WorkspaceContext = createContext<WorkspaceContextProps | undefined>(
  undefined,
);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<Workspace[]>(
    initialAvailableWorkspaces,
  );

  const { data } = api.workspace.all.useQuery();

  const switchWorkspace = (_workspace: Workspace) => {
    localStorage.setItem("workspacePublicId", _workspace.publicId);

    setWorkspace(_workspace);

    router.push(`/boards`);
  };

  useEffect(() => {
    if (!data) return;

    const storedWorkspaceId: string | null =
      localStorage.getItem("workspacePublicId");

    if (data?.length) {
      const workspaces = data
        .map(({ workspace }) => {
          if (!workspace) return;

          return {
            publicId: workspace.publicId,
            name: workspace.name,
          };
        })
        .filter((workspace) => workspace !== null) as Workspace[];

      if (workspaces.length) setAvailableWorkspaces(workspaces);
    }

    if (storedWorkspaceId !== null) {
      const newData = data;
      const selectedWorkspace = newData?.find(
        ({ workspace }) => workspace?.publicId === storedWorkspaceId,
      );

      if (!selectedWorkspace?.workspace) return;

      setWorkspace({
        publicId: selectedWorkspace.workspace.publicId,
        name: selectedWorkspace.workspace.name,
      });
    } else {
      const primaryWorkspace = data?.[0]?.workspace;
      if (!primaryWorkspace) return;
      localStorage.setItem("workspacePublicId", primaryWorkspace?.publicId);
      setWorkspace({
        publicId: primaryWorkspace?.publicId,
        name: primaryWorkspace?.name,
      });
    }
  }, [data]);

  return (
    <WorkspaceContext.Provider
      value={{ workspace, availableWorkspaces, switchWorkspace }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextProps => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

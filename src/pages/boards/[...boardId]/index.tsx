import { WorkspaceProvider } from "~/providers/workspace";
import Dashboard from "~/components/dashboard";
import BoardView from "~/views/board";

export default function BoardPage() {
  return (
    <WorkspaceProvider>
      <Dashboard>
        <BoardView />
      </Dashboard>
    </WorkspaceProvider>
  );
}

import { WorkspaceProvider } from "~/providers/workspace";
import Dashboard from "~/components/dashboard";
import MembersView from "~/views/members";

export default function MembersPage() {
  return (
    <WorkspaceProvider>
      <Dashboard>
        <MembersView />
      </Dashboard>
    </WorkspaceProvider>
  );
}

import { WorkspaceProvider } from "~/providers/workspace";
import Dashboard from "~/components/dashboard";
import CardView from "~/views/card";

export default function CardPage() {
  return (
    <WorkspaceProvider>
      <Dashboard>
        <CardView />
      </Dashboard>
    </WorkspaceProvider>
  );
}

import { WorkspaceProvider } from "~/providers/workspace";
import Dashboard from "~/components/dashboard";
import SettingsView from "~/views/settings";

export default function SettingsPage() {
  return (
    <WorkspaceProvider>
      <Dashboard>
        <SettingsView />
      </Dashboard>
    </WorkspaceProvider>
  );
}

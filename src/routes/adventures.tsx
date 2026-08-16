import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/adventures")({
  component: AdminAdventuresLayout,
});

function AdminAdventuresLayout() {
  return <Outlet />;
}

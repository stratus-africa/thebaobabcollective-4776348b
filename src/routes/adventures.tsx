import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/adventures")({
  component: AdminAdventuresLayout,
});

function AdminAdventuresLayout() {
  return <Outlet />;
}

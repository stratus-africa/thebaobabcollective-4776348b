import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/journeys/")({
  beforeLoad: () => {
    throw redirect({ to: "/adventures" });
  },
  component: () => null,
});

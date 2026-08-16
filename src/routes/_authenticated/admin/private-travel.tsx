import { createFileRoute } from "@tanstack/react-router";
import { PrivateTravelList } from "@/components/admin/PrivateTravelList";

export const Route = createFileRoute("/_authenticated/admin/private-travel")({
  component: PrivateTravelAdmin,
});

function PrivateTravelAdmin() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Private Travel Requests</h1>
      <PrivateTravelList />
    </div>
  );
}

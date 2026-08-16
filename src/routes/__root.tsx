import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { mergePageContent } from "@/lib/page-content.defaults";
import { recordVisit } from "@/lib/analytics.functions";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  const c = mergePageContent("not_found", null);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{c.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {c.cta_label}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Baobab Collective" },
      {
        name: "description",
        content:
          "The Baobab Collective website offers curated luxury safari journeys and authentic African experiences.",
      },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Baobab Collective" },
      {
        property: "og:description",
        content:
          "The Baobab Collective website offers curated luxury safari journeys and authentic African experiences.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Baobab Collective" },
      {
        name: "twitter:description",
        content:
          "The Baobab Collective website offers curated luxury safari journeys and authentic African experiences.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88c3b0b3-36b3-472d-9ae0-b28332a8e693/id-preview-45faa79e--d702f976-096d-4eec-878b-b661d48940a1.lovable.app-1781269926378.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/88c3b0b3-36b3-472d-9ae0-b28332a8e693/id-preview-45faa79e--d702f976-096d-4eec-878b-b661d48940a1.lovable.app-1781269926378.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const record = useServerFn(recordVisit);

  useEffect(() => {
    // Record one visit per browser session for public visitors only.
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem("visitor_recorded")) {
      void (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          const user = data.user;

          if (user) {
            const { data: role } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", user.id)
              .eq("role", "admin")
              .maybeSingle();

            if (role?.role === "admin") {
              sessionStorage.setItem("visitor_recorded", "admin-skipped");
              return;
            }
          }

          const res = await record();
          if (!res.ok) console.warn("Visit recording failed:", res.error);
          sessionStorage.setItem("visitor_recorded", "1");
        } catch (err) {
          console.warn("Visit recording error:", err);
        }
      })();
    }
  }, [record]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <ScrollToTopButton />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

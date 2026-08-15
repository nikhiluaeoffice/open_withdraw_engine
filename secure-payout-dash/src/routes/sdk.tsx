import { createFileRoute } from "@tanstack/react-router";
import { DocsPage } from "./docs";

export const Route = createFileRoute("/sdk")({
  head: () => ({
    meta: [
      { title: "Developer SDK & API Documentation — ChainPayout" },
    ],
  }),
  component: DocsPage,
});

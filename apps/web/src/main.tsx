import React from "react";
import { createRoot } from "react-dom/client";
import { ProjectCreateForm } from "./ProjectCreateForm";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ProjectCreateForm />
  </React.StrictMode>,
);

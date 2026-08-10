import { Suspense } from "react";
import { CodeLoginForm } from "./code-form";

export default function CodeLoginPage() {
  return (
    <Suspense>
      <CodeLoginForm />
    </Suspense>
  );
}

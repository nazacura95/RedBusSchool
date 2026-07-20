"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props}>
      {pending && <Spinner className="mr-2" />}
      {pending ? pendingText : children}
    </Button>
  );
}

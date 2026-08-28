import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Sao chép link",
  variant = "outline",
  withText = false,
}: {
  value: string;
  label?: string;
  variant?: "outline" | "secondary" | "default" | "ghost";
  withText?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Đã sao chép vào bộ nhớ tạm");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Trình duyệt không cho phép sao chép tự động");
    }
  }

  const Icon = copied ? Check : Copy;

  return (
    <Button
      type="button"
      variant={variant}
      size={withText ? "default" : "icon"}
      aria-label={label}
      onClick={() => void copy()}
    >
      <Icon className={withText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {withText ? label : null}
    </Button>
  );
}

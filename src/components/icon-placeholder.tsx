import * as React from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  XIcon,
} from "lucide-react";

// shadcn's radix-nova preset generates <IconPlaceholder lucide="..." /> calls
// and resolves the glyph from the configured icon library. This project keeps a
// small explicit map so only the icons actually used are bundled.
const REGISTRY: Record<string, React.ComponentType<React.ComponentProps<"svg">>> = {
  CheckIcon,
  ChevronRightIcon,
  CircleIcon,
  MoreHorizontalIcon,
  PanelLeftIcon,
  XIcon,
};

type IconPlaceholderProps = React.ComponentProps<"svg"> & {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
};

export function IconPlaceholder({ lucide, ...props }: IconPlaceholderProps) {
  const Icon = lucide ? REGISTRY[lucide] : undefined;
  if (!Icon) return null;
  return <Icon aria-hidden="true" {...props} />;
}

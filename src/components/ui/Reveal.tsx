import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";

type RevealProps<T extends ElementType> = {
  as?: T;
  /** Stagger position inside a group; becomes --reveal-index. */
  index?: number;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "index">;

// RevealObserver changes data-reveal on the client, often before this section hydrates, so the attribute differs
// from the server HTML on purpose; suppressHydrationWarning covers this element's own attributes only.
export default function Reveal<T extends ElementType = "div">({ as, index, style, ...props }: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  const mergedStyle = index === undefined ? style : ({ ...style, "--reveal-index": index } as CSSProperties);
  return <Tag data-reveal="" suppressHydrationWarning style={mergedStyle} {...props} />;
}

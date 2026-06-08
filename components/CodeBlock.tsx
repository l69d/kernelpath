// Server component: highlight a raw code string by routing it through the
// markdown renderer as a fenced block (reuses rehype-highlight).
import Markdown from "@/components/Markdown";

export default function CodeBlock({
  code,
  lang,
}: {
  code: string;
  lang?: string;
}) {
  const fence = "```";
  const language = (lang || "").trim();
  const body = `${fence}${language}\n${code.replace(/\s+$/, "")}\n${fence}`;
  return <Markdown>{body}</Markdown>;
}

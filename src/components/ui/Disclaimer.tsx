import { DISCLAIMER_TEXT } from "@/lib/compliance";

export default function Disclaimer() {
  return (
    <div className="mt-2 text-center">
      <p className="text-xs py-4 px-4 leading-relaxed rounded-r1 text-bo-ink-faint bg-white/50">
        {DISCLAIMER_TEXT}
      </p>
      <div className="mt-3 pb-2">
        <p className="text-[10px] text-bo-ink-muted font-sans mb-1">
          Produced by
        </p>
        <a
          href="https://blog-engine.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-bo-accent font-sans no-underline pressable"
        >
          みおのミハダノート
        </a>
      </div>
    </div>
  );
}

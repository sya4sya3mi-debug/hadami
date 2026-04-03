import { DISCLAIMER_TEXT } from "@/lib/compliance";

export default function Disclaimer() {
  return (
    <p
      className="text-xs text-center py-4 px-4 leading-relaxed rounded-xl mt-2"
      style={{ color: "#BDBDBD", background: "rgba(255,255,255,0.5)" }}
    >
      {DISCLAIMER_TEXT}
    </p>
  );
}

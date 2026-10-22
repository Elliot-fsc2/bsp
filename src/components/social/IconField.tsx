"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

export function IconField({
  icon: Icon,
  isPassword,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon; isPassword?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <Icon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa2b1]" />
      <input
        {...props}
        type={isPassword ? (visible ? "text" : "password") : props.type}
        className="input"
        style={{ paddingLeft: "2.75rem", paddingRight: isPassword ? "2.75rem" : "1rem" }}
      />
      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((value) => !value)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa2b1] transition hover:text-[#1E4488]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      ) : null}
    </div>
  );
}

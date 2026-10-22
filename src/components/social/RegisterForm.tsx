"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GraduationCap, Lock, Mail, MapPin, Phone, User, type LucideIcon } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { IconField } from "@/components/social/IconField";
import { LocationPicker, type LocationValue } from "@/components/social/LocationPicker";
import type { RegistrationField, RegistrationFormContent } from "@/lib/registration-form";

const FIELD_ICONS: Record<string, LucideIcon> = {
  fullName: User,
  email: Mail,
  phone: Phone,
  password: Lock,
  address: MapPin,
  education: GraduationCap,
};

function fieldInputType(field: RegistrationField): string {
  switch (field.type) {
    case "email":
    case "password":
    case "tel":
    case "number":
    case "date":
      return field.type;
    default:
      return "text";
  }
}

export function RegisterForm({ form, googleMapsApiKey }: { form: RegistrationFormContent; googleMapsApiKey: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [locations, setLocations] = useState<Record<string, LocationValue>>({});

  const fields = form.fields.filter((field) => field.visible);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === "location" && googleMapsApiKey) {
        const location = locations[field.key];
        payload[field.key] = location?.address ?? String(data.get(field.key) ?? "");
        payload[`${field.key}__lat`] = location?.lat ?? "";
        payload[`${field.key}__lng`] = location?.lng ?? "";
      } else {
        payload[field.key] = String(data.get(field.key) ?? "");
      }
    }
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(body.error ?? "Unable to register.");
      return;
    }
    router.push("/dashboard/payment");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1B365F] lg:block">
        <img src="/images/community.jpg" alt="DeMolay members" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[#1B365F]/85" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandMark light />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFCF00]">{form.eyebrow}</p>
            <h1 className="mt-4 max-w-md font-serif text-4xl leading-tight text-white">{form.heading}</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">{form.paragraph}</p>
          </div>
          <div className="grid max-w-sm grid-cols-3 gap-3 text-center text-xs font-semibold text-white/80">
            <div className="rounded-2xl bg-white/10 p-3">🎓<p className="mt-1">Study & pass</p></div>
            <div className="rounded-2xl bg-white/10 p-3">🤝<p className="mt-1">Serve & lead</p></div>
            <div className="rounded-2xl bg-white/10 p-3">⚜️<p className="mt-1">Certify</p></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          <div className="mb-8 lg:hidden">
            <BrandMark />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a93a6]">{form.formEyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl text-[#1B365F]">{form.formTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b7280]">{form.formBlurb}</p>

          <form onSubmit={onSubmit} className="mt-7 flex flex-wrap gap-4">
            {fields.map((field) => {
              const wide = field.type === "textarea" || field.type === "select" || field.type === "location";
              const Icon: LucideIcon | undefined = FIELD_ICONS[field.key];
              const hasIcon = Icon !== undefined;
              return (
                <div key={field.key} className={wide ? "w-full" : "w-full sm:min-w-[calc(50%_-_0.5rem)] sm:flex-1"}>
                  {field.type === "location" && googleMapsApiKey ? (
                    <LocationPicker
                      apiKey={googleMapsApiKey}
                      name={field.key}
                      value={locations[field.key]?.address ?? ""}
                      placeholder={field.label}
                      required={field.required}
                      onChange={(value) => setLocations((prev) => ({ ...prev, [field.key]: value }))}
                    />
                  ) : field.type === "textarea" ? (
                    <div className="relative">
                      {Icon ? <Icon size={18} className="pointer-events-none absolute left-4 top-4 text-[#9aa2b1]" /> : null}
                      <textarea
                        className="input min-h-[90px]"
                        style={hasIcon ? { paddingLeft: "2.75rem" } : undefined}
                        name={field.key}
                        required={field.required}
                        placeholder={field.label}
                      />
                    </div>
                  ) : field.type === "select" ? (
                    <select className="input" name={field.key} required={field.required} defaultValue="">
                      <option value="" disabled>
                        {field.label}
                      </option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : Icon ? (
                    <IconField
                      icon={Icon}
                      name={field.key}
                      type={fieldInputType(field)}
                      isPassword={field.type === "password"}
                      placeholder={field.label}
                      required={field.required}
                      minLength={field.type === "password" ? 6 : undefined}
                    />
                  ) : (
                    <input
                      className="input"
                      name={field.key}
                      type={fieldInputType(field)}
                      placeholder={field.label}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}

            {error ? (
              <p className="w-full rounded-xl bg-[#FFF1F0] px-4 py-2.5 text-sm text-[#AC242A]">{error}</p>
            ) : null}

            <button
              className="w-full rounded-full bg-[#1E4488] py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(30,68,136,0.35)] transition hover:bg-[#1B365F] disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Submitting…" : "Continue to payment"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-[#1E4488]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

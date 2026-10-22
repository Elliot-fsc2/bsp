"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  KeyRound,
  Pencil,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { buildMemberFields, type RegistrationFormContent } from "@/lib/registration-form";
import { initials } from "@/lib/utils";

type Props = {
  form: RegistrationFormContent;
  answers: Record<string, string>;
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    address: string | null;
    education: string | null;
    profileBio: string | null;
    profilePhoto: string | null;
    coverPhoto: string | null;
    professionalHeadline: string | null;
    resumeSummary: string | null;
    skills: string | null;
    experience: string | null;
    birthDate: string | null;
    registrationDetails: string | null;
    passwordChangedAt: string | null;
  };
};

export function ProfileSettings({ user, form: registrationForm, answers }: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const profileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    profileBio: user.profileBio ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
    education: user.education ?? "",
    professionalHeadline: user.professionalHeadline ?? "",
    resumeSummary: user.resumeSummary ?? "",
    skills: user.skills ?? "",
    experience: user.experience ?? "",
    birthDate: user.birthDate ?? "",
  });
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto);
  const [coverPhoto, setCoverPhoto] = useState(user.coverPhoto);
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [registration, setRegistration] = useState<Record<string, string>>(answers);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationPending, setRegistrationPending] = useState(false);
  const requiresChange = search.get("changePassword") === "1" || !user.passwordChangedAt;
  const skillList = form.skills.split(/[,\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 10);
  const registrationFields = buildMemberFields(registrationForm).filter((field) => field.kind !== "fullName");

  async function saveRegistration(event: React.FormEvent) {
    event.preventDefault();
    setRegistrationPending(true);
    setRegistrationMessage("");
    const response = await fetch("/api/profile/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationAnswers: registration }),
    });
    setRegistrationPending(false);
    setRegistrationMessage(response.ok ? "Registration details saved." : "Could not save registration details.");
    if (response.ok) router.refresh();
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setPending(false);
    setMessage(response.ok ? "Profile and résumé saved." : "Could not save profile.");
  }

  async function uploadMedia(kind: "profile" | "cover", file: File) {
    setMediaBusy(true);
    setMessage("");
    const data = new FormData();
    data.set("kind", kind);
    data.set("file", file);
    const response = await fetch("/api/profile/media", { method: "POST", body: data });
    const result = (await response.json().catch(() => ({}))) as { error?: string; url?: string };
    setMediaBusy(false);
    if (!response.ok || !result.url) {
      setMessage(result.error ?? "Could not upload photo.");
      return;
    }
    if (kind === "profile") setProfilePhoto(result.url);
    else setCoverPhoto(result.url);
    setMessage(`${kind === "profile" ? "Profile" : "Cover"} photo updated.`);
  }

  async function removeMedia(kind: "profile" | "cover") {
    setMediaBusy(true);
    await fetch("/api/profile/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    if (kind === "profile") setProfilePhoto(null);
    else setCoverPhoto(null);
    setMediaBusy(false);
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setPasswordMessage("");
    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setPasswordMessage(data.error ?? "Password could not be changed.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setPasswordMessage("Password updated. Your account is secure.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-[#dce5f1] bg-white shadow-sm">
        <div className="relative h-44 bg-[#1E4488] md:h-52">
          {coverPhoto ? <img src={coverPhoto} alt="Profile cover" className="h-full w-full object-cover" /> : null}
          <div className="absolute right-4 top-4 flex gap-2">
            <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia("cover", file); event.target.value = ""; }} />
            <button type="button" disabled={mediaBusy} onClick={() => coverInput.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1B365F] shadow">
              <Camera size={15} /> {coverPhoto ? "Change cover" : "Add cover"}
            </button>
            {coverPhoto ? <button type="button" onClick={() => void removeMedia("cover")} className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#AC242A] shadow"><X size={14} /></button> : null}
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="relative">
              <span className="grid h-28 w-28 overflow-hidden rounded-full border border-[#dce5f1] bg-[#1B365F] shadow-md md:h-32 md:w-32">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full place-items-center font-serif text-4xl text-[#FFCF00]">{initials(user.fullName)}</span>
                )}
              </span>
              <input ref={profileInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadMedia("profile", file); event.target.value = ""; }} />
              <button type="button" disabled={mediaBusy} onClick={() => profileInput.current?.click()} title="Change profile photo" className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[#FFCF00] text-[#1B365F] shadow">
                <Camera size={16} />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl leading-tight text-[#1B365F]">{user.fullName}</h2>
              <p className="mt-1 text-sm font-semibold text-[#0076AF]">{form.professionalHeadline || "DeMolay Leadership Pathway member"}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#708099]">
                <span>@{user.email.split("@")[0]} · {user.email}</span>
              </p>
            </div>
            {profilePhoto ? <button type="button" className="btn btn-ghost py-2 text-xs" onClick={() => void removeMedia("profile")}>Remove photo</button> : null}
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4C5E73]">{form.profileBio || "Add a short DeMolay leadership goal to introduce yourself."}</p>
        </div>

        <nav className="flex overflow-x-auto border-t border-[#e3eaf4] px-6 text-sm font-semibold text-[#708099] md:px-8">
          <a href="#profile" className="border-b-[3px] border-[#1E4488] px-4 py-3 text-[#1E4488]">Profile</a>
          <a href="#resume" className="px-4 py-3 hover:text-[#1E4488]">Résumé</a>
          <a href="#security" className="px-4 py-3 hover:text-[#1E4488]">Security</a>
        </nav>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
        <form id="profile" onSubmit={saveProfile} className="space-y-6">
          <section className="rounded-[24px] border border-[#dce5f1] bg-white p-6 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0076AF]"><Pencil size={15} /> Edit profile</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-[#1B365F] md:col-span-2">Professional headline<input className="input mt-2" value={form.professionalHeadline} onChange={(event) => setForm({ ...form, professionalHeadline: event.target.value })} placeholder="Member · Service project coordinator" maxLength={180} /></label>
              <label className="text-sm font-medium text-[#1B365F]">Birth date<input className="input mt-2" type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} /></label>
              <label className="text-sm font-medium text-[#1B365F] md:col-span-2">Bio<textarea className="input mt-2 min-h-[100px]" value={form.profileBio} onChange={(event) => setForm({ ...form, profileBio: event.target.value })} /></label>
              <label className="text-sm font-medium text-[#1B365F]">Phone<input className="input mt-2" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label className="text-sm font-medium text-[#1B365F]">Location<input className="input mt-2" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            </div>
          </section>

          <section id="resume" className="rounded-[24px] border border-[#dce5f1] bg-white p-6 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0076AF]"><FileText size={15} /> Résumé profile</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-[#1B365F]">Education<textarea className="input mt-2 min-h-[80px]" value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} /></label>
              <label className="block text-sm font-medium text-[#1B365F]">Professional summary<textarea className="input mt-2 min-h-[100px]" value={form.resumeSummary} onChange={(event) => setForm({ ...form, resumeSummary: event.target.value })} placeholder="Summarize your leadership, service, and career goals…" /></label>
              <label className="block text-sm font-medium text-[#1B365F]">Skills<textarea className="input mt-2 min-h-[80px]" value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} placeholder="Public speaking, Event planning, Community service…" /></label>
              <label className="block text-sm font-medium text-[#1B365F]">Experience & achievements<textarea className="input mt-2 min-h-[130px]" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} placeholder="List projects, awards, volunteer work, and experience…" /></label>
            </div>
            <button className="btn btn-dark mt-5" disabled={pending} type="submit"><Save size={16} /> {pending ? "Saving…" : "Save profile & résumé"}</button>
            {message ? <span className={`ml-3 text-sm ${message.includes("saved") || message.includes("updated") ? "text-[#00694B]" : "text-[#AC242A]"}`}>{message}</span> : null}
          </section>
        </form>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[#dce5f1] bg-white p-6 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0076AF]"><BriefcaseBusiness size={15} /> Résumé preview</p>
            <h3 className="mt-4 font-serif text-2xl text-[#1B365F]">{user.fullName}</h3>
            <p className="text-sm font-semibold text-[#0076AF]">{form.professionalHeadline || "Leadership Pathway member"}</p>
            {form.resumeSummary ? <p className="mt-4 text-sm leading-6 text-[#4C5E73]">{form.resumeSummary}</p> : null}
            <div className="mt-5 space-y-4 border-t border-[#e3eaf4] pt-5">
              {form.education ? <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1B365F]"><GraduationCap size={15} className="text-[#0076AF]" /> Education</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#52657A]">{form.education}</p></div> : null}
              {skillList.length ? <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1B365F]"><Sparkles size={15} className="text-[#0076AF]" /> Skills</p><div className="mt-2 flex flex-wrap gap-2">{skillList.map((skill) => <span key={skill} className="rounded-full bg-[#EAF1F9] px-3 py-1 text-xs font-semibold text-[#1E4488]">{skill}</span>)}</div></div> : null}
              {form.experience ? <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1B365F]"><BriefcaseBusiness size={15} className="text-[#0076AF]" /> Experience</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#52657A]">{form.experience}</p></div> : null}
            </div>
            {!form.resumeSummary && !form.education && !form.skills && !form.experience ? <p className="mt-4 text-sm text-[#708099]">Complete the résumé form to build your leadership profile.</p> : null}
          </section>

          {registrationFields.length ? (
            <form onSubmit={saveRegistration} className="rounded-[24px] border border-[#dce5f1] bg-white p-6 shadow-sm">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0076AF]"><ClipboardList size={15} /> Registration details</p>
              <p className="mt-2 text-xs text-[#708099]">Keep your registration information up to date.</p>
              <div className="mt-4 space-y-4">
                {registrationFields.map((field) =>
                  field.kind === "select" ? (
                    <label key={field.key} className="block text-sm font-medium text-[#1B365F]">
                      {field.label}
                      <select
                        className="input mt-2"
                        value={registration[field.key] ?? ""}
                        onChange={(event) => setRegistration({ ...registration, [field.key]: event.target.value })}
                      >
                        <option value="">—</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label key={field.key} className="block text-sm font-medium text-[#1B365F]">
                      {field.label}
                      <input
                        className="input mt-2"
                        value={registration[field.key] ?? ""}
                        onChange={(event) => setRegistration({ ...registration, [field.key]: event.target.value })}
                      />
                    </label>
                  ),
                )}
              </div>
              <button className="btn btn-dark mt-5" disabled={registrationPending} type="submit">
                <Save size={16} /> {registrationPending ? "Saving…" : "Save registration details"}
              </button>
              {registrationMessage ? (
                <p className={`mt-3 text-sm ${registrationMessage.includes("saved") ? "text-[#00694B]" : "text-[#AC242A]"}`}>{registrationMessage}</p>
              ) : null}
            </form>
          ) : user.registrationDetails ? (
            <section className="rounded-[24px] border border-[#dce5f1] bg-white p-6 shadow-sm">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#0076AF]"><ClipboardList size={15} /> Registration details</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#52657A]">{user.registrationDetails}</p>
            </section>
          ) : null}

          <form id="security" onSubmit={changePassword} className={`rounded-[24px] border p-6 shadow-sm ${requiresChange ? "border-[#1B365F] bg-[#1B365F] text-white" : "border-[#dce5f1] bg-white text-[#1B365F]"}`}>
            <p className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] ${requiresChange ? "text-[#FFCF00]" : "text-[#0076AF]"}`}><ShieldCheck size={15} /> Profile & security</p>
            <h3 className="mt-3 font-serif text-2xl">{requiresChange ? "Choose your personal password" : "Change password"}</h3>
            {requiresChange ? <p className="mt-2 text-sm leading-6 text-white/75">Change the password you selected at registration before continuing.</p> : null}
            <label className="mt-5 block text-sm">Current password<input className="input mt-2" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
            <label className="mt-4 block text-sm">New password (8+ characters)<input className="input mt-2" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
            <button className={`btn mt-5 ${requiresChange ? "btn-gold" : "btn-dark"}`} disabled={pending} type="submit"><KeyRound size={16} /> Update password</button>
            {passwordMessage ? <p className={`mt-3 text-sm ${passwordMessage.includes("secure") ? "text-[#00694B]" : "text-[#AC242A]"}`}>{passwordMessage}</p> : null}
          </form>
        </aside>
      </div>
    </div>
  );
}

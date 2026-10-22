export type RegistrationFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "location";

export type RegistrationField = {
  key: string;
  label: string;
  type: RegistrationFieldType;
  required: boolean;
  visible: boolean;
  system: boolean;
  options?: string[];
};

export type RegistrationFormContent = {
  eyebrow: string;
  heading: string;
  paragraph: string;
  formEyebrow: string;
  formTitle: string;
  formBlurb: string;
  fields: RegistrationField[];
};

export const BUILTIN_FIELD_TYPES: Record<string, RegistrationFieldType> = {
  fullName: "text",
  email: "email",
  password: "password",
  phone: "tel",
  address: "location",
  education: "textarea",
};

export const SYSTEM_FIELD_KEYS = ["fullName", "email", "password"];

const FIELD_TYPES: RegistrationFieldType[] = [
  "text",
  "email",
  "password",
  "tel",
  "number",
  "date",
  "textarea",
  "select",
  "location",
];

const MAX_FIELDS = 40;

export const DEFAULT_REGISTRATION_FORM: RegistrationFormContent = {
  eyebrow: "Join the pathway",
  heading: "Leadership Correspondence Course Application",
  paragraph:
    "The DeMolay Leadership Correspondence Course (L.C.C.) is a five-part course designed to test and increase your knowledge covering various fields in DeMolay such as history and heritage, Chapter administration, DeMolay Ritual, honors and awards, and the current rules and regulations of the Supreme Council, Order of DeMolay of the Republic of the Philippines; to give a better overall picture of DeMolay.",
  formEyebrow: "Create account",
  formTitle: "Register for DeMolay Nexus",
  formBlurb:
    "After you submit this form you will upload an offline payment receipt. The leadership council verifies it before Level 1 opens, and you will receive confirmation by email.",
  fields: [
    { key: "fullName", label: "Full name", type: "text", required: true, visible: true, system: true },
    { key: "email", label: "Email address", type: "email", required: true, visible: true, system: true },
    { key: "phone", label: "Phone (optional)", type: "tel", required: false, visible: true, system: false },
    { key: "password", label: "Password", type: "password", required: true, visible: true, system: true },
    { key: "address", label: "Complete mailing address", type: "location", required: false, visible: true, system: false },
    {
      key: "education",
      label: "Education background (optional)",
      type: "textarea",
      required: false,
      visible: true,
      system: false,
    },
  ],
};

function str(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.trim().slice(0, max);
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function normalizeOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const options: string[] = [];
  for (const item of value) {
    const text = typeof item === "string" ? item.trim().slice(0, 80) : "";
    if (!text || seen.has(text)) continue;
    seen.add(text);
    options.push(text);
  }
  return options;
}

function normalizeField(raw: unknown, index: number, seenKeys: Set<string>): RegistrationField | null {
  const input = record(raw);
  const builtinType = BUILTIN_FIELD_TYPES[input.key as string];
  const isBuiltin = builtinType !== undefined;

  let key: string;
  if (isBuiltin) {
    key = input.key as string;
  } else {
    const base = slug(typeof input.key === "string" ? input.key : "") || `field_${index + 1}`;
    key = base.startsWith("custom_") ? base : `custom_${base}`;
  }
  if (seenKeys.has(key)) return null;
  seenKeys.add(key);

  const system = SYSTEM_FIELD_KEYS.includes(key);
  const candidate = input.type;
  const chosen = FIELD_TYPES.includes(candidate as RegistrationFieldType)
    ? (candidate as RegistrationFieldType)
    : undefined;
  let type: RegistrationFieldType;
  if (system) {
    type = builtinType;
  } else if (isBuiltin) {
    type = chosen ?? builtinType;
  } else {
    type = chosen ?? "text";
  }

  const label = str(input.label, key, 120) || key;
  const field: RegistrationField = {
    key,
    label,
    type,
    required: system ? true : bool(input.required, false),
    visible: system ? true : bool(input.visible, true),
    system,
  };
  if (type === "select") field.options = normalizeOptions(input.options);
  return field;
}

export function normalizeRegistrationForm(raw: unknown): RegistrationFormContent {
  const input = record(parse(raw));
  const fallback = DEFAULT_REGISTRATION_FORM;
  const fieldInput = Array.isArray(input.fields) ? input.fields : fallback.fields;
  const seenKeys = new Set<string>();
  const fields: RegistrationField[] = [];

  for (const [index, item] of fieldInput.entries()) {
    if (fields.length >= MAX_FIELDS) break;
    const field = normalizeField(item, index, seenKeys);
    if (field) fields.push(field);
  }

  for (const key of SYSTEM_FIELD_KEYS) {
    if (fields.some((field) => field.key === key)) continue;
    const fallbackField = fallback.fields.find((field) => field.key === key)!;
    fields.unshift(fallbackField);
    seenKeys.add(key);
  }

  return {
    eyebrow: str(input.eyebrow, fallback.eyebrow, 120),
    heading: str(input.heading, fallback.heading, 200),
    paragraph: str(input.paragraph, fallback.paragraph, 1600),
    formEyebrow: str(input.formEyebrow, fallback.formEyebrow, 120),
    formTitle: str(input.formTitle, fallback.formTitle, 200),
    formBlurb: str(input.formBlurb, fallback.formBlurb, 1200),
    fields,
  };
}

export function isBuiltinFieldKey(key: string): boolean {
  return BUILTIN_FIELD_TYPES[key] !== undefined;
}

export type RegistrationFieldMap = {
  lastName?: string;
  givenName?: string;
  middleName?: string;
  facebookName?: string;
  facebookLink?: string;
  masterMasons?: string;
  chapter?: string;
  membershipStatus?: string;
};

export function mapRegistrationFields(form: RegistrationFormContent): RegistrationFieldMap {
  const map: RegistrationFieldMap = {};
  for (const field of form.fields) {
    const label = field.label.toLowerCase();
    const isFacebook = label.includes("facebook");
    const isLink = label.includes("link") || label.includes("url");
    if (!map.lastName && (field.key === "fullName" || label.includes("last name"))) map.lastName = field.key;
    if (!map.givenName && label.includes("given")) map.givenName = field.key;
    if (!map.middleName && label.includes("middle")) map.middleName = field.key;
    if (!map.facebookLink && isFacebook && isLink) map.facebookLink = field.key;
    if (!map.facebookName && isFacebook && !isLink) map.facebookName = field.key;
    if (!map.masterMasons && label.includes("master mason")) map.masterMasons = field.key;
    if (!map.chapter && label.includes("chapter")) map.chapter = field.key;
    if (!map.membershipStatus && label.includes("membership")) map.membershipStatus = field.key;
  }
  return map;
}

export type RegistrationValueSource = {
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  education: string | null;
  registrationAnswers: unknown;
};

// MySQL returns `json` columns as strings through mysql2, so parse defensively.
export function parseAnswers(value: unknown): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, string>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, string>;
    } catch {
      return {};
    }
  }
  return {};
}

export function sanitizeAnswers(value: unknown): Record<string, string> | null {
  const source = typeof value === "string" ? parseAnswers(value) : value;
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(source as Record<string, unknown>)) {
    if (typeof raw === "string" && raw.trim()) out[key.slice(0, 60)] = raw.trim().slice(0, 1000);
    if (Object.keys(out).length >= 60) break;
  }
  return Object.keys(out).length ? out : null;
}

export function readRegistrationValue(source: RegistrationValueSource, key: string | undefined): string {
  if (!key) return "";
  const builtins: Record<string, string> = {
    fullName: source.fullName,
    email: source.email,
    phone: source.phone ?? "",
    address: source.address ?? "",
    education: source.education ?? "",
  };
  if (key in builtins) return builtins[key];
  return parseAnswers(source.registrationAnswers)[key] ?? "";
}

export type MemberFieldDescriptor = {
  key: string;
  label: string;
  kind: "fullName" | "select" | "text";
  options?: string[];
};

// The editable/visible registration field set, matched by label. Shared by the edit form and the
// view so both always show the same data.
export function buildMemberFields(form: RegistrationFormContent): MemberFieldDescriptor[] {
  const map = mapRegistrationFields(form);
  const fieldByKey = new Map(form.fields.map((field) => [field.key, field]));
  const skip = new Set(["password", "email", "phone", "address", "education"]);
  const out: MemberFieldDescriptor[] = [];
  const push = (key: string | undefined) => {
    if (!key || out.some((item) => item.key === key)) return;
    const field = fieldByKey.get(key);
    if (!field || skip.has(field.key)) return;
    if (field.key === "fullName") {
      out.push({ key, label: field.label, kind: "fullName" });
      return;
    }
    out.push({ key, label: field.label, kind: field.type === "select" ? "select" : "text", options: field.options });
  };
  [map.lastName, map.givenName, map.middleName, map.facebookName, map.facebookLink, map.masterMasons, map.chapter, map.membershipStatus].forEach(push);
  return out;
}

export function memberRegistrationRows(source: RegistrationValueSource, form: RegistrationFormContent): { label: string; value: string }[] {
  const answers = parseAnswers(source.registrationAnswers);
  const rows: { label: string; value: string }[] = [];
  for (const field of buildMemberFields(form)) {
    const value = field.kind === "fullName" ? source.fullName : answers[field.key] ?? "";
    if (value) rows.push({ label: field.label, value });
  }
  return rows;
}

export function memberDetailRows(source: RegistrationValueSource, form: RegistrationFormContent): { label: string; value: string }[] {
  const rows = memberRegistrationRows(source, form);
  const core = [
    { label: "Email", value: source.email },
    { label: "Phone", value: source.phone ?? "" },
    { label: "Address", value: source.address ?? "" },
    { label: "Education", value: source.education ?? "" },
  ];
  for (const item of core) if (item.value) rows.push(item);
  return rows;
}

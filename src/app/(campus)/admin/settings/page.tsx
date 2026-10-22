import { saveSettingsAction } from "@/actions/admin";
import { ImageUrlField } from "@/components/ImageUrlField";
import { RichTextEditor } from "@/components/RichTextEditor";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const themes = [
  { id: "forest", name: "Forest", note: "Scout green, cream, and gold", swatch: "#2d6a4f" },
  { id: "bloom", name: "Meadow", note: "Warm and friendly daylight", swatch: "#ff5c8a" },
  { id: "ocean", name: "River", note: "Cool blue trails", swatch: "#1289a7" },
  { id: "sunset", name: "Campfire", note: "Warm evening tones", swatch: "#ef476f" },
];

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Portal settings"
        title="How the portal looks"
        text="Change the name on the banner, the theme, and whether new members can sign up."
      />
      <form action={saveSettingsAction} className="bloom-card space-y-5 p-6">
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Portal name</span>
          <input className="bloom-input" name="siteName" defaultValue={settings.siteName} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Tagline</span>
          <input className="bloom-input" name="tagline" defaultValue={settings.tagline} />
        </label>
        <div>
          <span className="mb-1 block text-sm font-extrabold">Welcome message</span>
          <RichTextEditor
            name="welcomeMessage"
            defaultValue={settings.welcomeMessage}
            minHeight={150}
            placeholder="Shown on the landing page and the portal intro."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">Support email</span>
            <input className="bloom-input" name="supportEmail" defaultValue={settings.supportEmail} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-extrabold">Scout buddy name</span>
            <input className="bloom-input" name="mascotName" defaultValue={settings.mascotName} />
          </label>
        </div>

        <div className="grid gap-5 border-t-2 border-[var(--line)] pt-5 md:grid-cols-2">
          <ImageUrlField
            name="logoUrl"
            label="Logo"
            defaultValue={settings.logoUrl}
            placeholder="/uploads/logo.png or /images/logo.svg"
            hint="Shown on the sidebar and landing page. Leave empty to use the ⚜️ emblem."
          />
          <ImageUrlField
            name="faviconUrl"
            label="Browser tab icon (favicon)"
            defaultValue={settings.faviconUrl}
            placeholder="/images/logo.svg"
            hint="The little icon shown in the browser tab."
          />
        </div>
        <fieldset>
          <legend className="mb-3 text-sm font-extrabold">Theme</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((theme) => (
              <label key={theme.id} className="bloom-card cursor-pointer p-4">
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  defaultChecked={settings.theme === theme.id}
                  className="mr-2"
                />
                <span className="font-extrabold">{theme.name}</span>
                <span className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                  <span className="h-6 w-6 rounded-full" style={{ background: theme.swatch }} />
                  {theme.note}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="allowRegistration" defaultChecked={settings.allowRegistration} />
          Allow public sign-up
        </label>
        <label className="flex items-center gap-2 font-bold">
          <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} />
          Maintenance mode (shown as a setting; the portal stays open for this demo)
        </label>
        <button className="bloom-btn">Save settings</button>
      </form>
    </div>
  );
}

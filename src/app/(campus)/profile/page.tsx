import { disconnectDriveAction } from "@/actions/google";
import { Modal } from "@/components/Modal";
import { ProfileForm } from "@/components/ProfileForm";
import { Avatar, PageHeader, RoleBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { driveConfigured } from "@/lib/drive";
import { getDriveAccount } from "@/lib/drive-account";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DRIVE_NOTES: Record<string, string> = {
  connected: "Google Drive is connected. Your uploads will be saved in your own Drive.",
  denied: "You cancelled the Google sign-in, so nothing changed.",
  error: "Google did not accept the sign-in. Please try again.",
  "not-configured": "Google Drive is not configured on this server yet.",
};

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ drive?: string }> }) {
  const user = await requireUser();
  const { drive: driveNote } = await searchParams;

  const driveAvailable = driveConfigured();
  const drive = driveAvailable ? await getDriveAccount(user.id) : null;
  const connected = Boolean(drive?.refreshToken);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="You"
        title="Your Scout card"
        text="A name, a color, a little story. That's plenty."
        action={
          <Modal title="Edit profile" size="lg" trigger="Edit profile">
            <ProfileForm user={user} />
          </Modal>
        }
      />
      <div className="bloom-card flex items-center gap-4 p-5">
        <Avatar name={user.name} color={user.avatarColor} size={72} />
        <div>
          <h2 className="font-display text-2xl">{user.name}</h2>
          <RoleBadge role={user.role} />
          <p className="mt-1 text-sm text-[var(--muted)]">{user.email}</p>
        </div>
      </div>

      <div className="bloom-card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Google Drive</h2>
            <p className="text-sm text-[var(--muted)]">
              Upload your video and photo proof straight into your own Drive. The file never touches the council
              server, and it is shared with your reviewers automatically.
            </p>
          </div>
          {connected ? <span className="sticker bg-[#d8f3dc]">Connected</span> : null}
        </div>

        {driveNote && DRIVE_NOTES[driveNote] ? (
          <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm font-bold">{DRIVE_NOTES[driveNote]}</p>
        ) : null}

        {!driveAvailable ? (
          <p className="mt-4 rounded-2xl bg-[#fff3c4] px-3 py-2 text-sm font-bold">
            Google Drive is switched off on this server. Add <code>GOOGLE_CLIENT_ID</code> and{" "}
            <code>GOOGLE_CLIENT_SECRET</code> to <code>.env</code> to turn it on. Until then, uploads are stored in
            the council server&apos;s <code>public/uploads</code> folder.
          </p>
        ) : connected ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm">
              Signed in as <strong>{drive?.email ?? "your Google account"}</strong>
            </p>
            <form action={disconnectDriveAction} className="ml-auto">
              <button className="bloom-btn ghost">Disconnect Google Drive</button>
            </form>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[var(--muted)]">
              You have not connected a Google account yet. Uploads go to the council server for now.
            </p>
            {/* A plain <a>: this endpoint 302s to Google, so it must be a real
                navigation, not a Next Link prefetch/RSC fetch (which CORS-blocks). */}
            <a href="/api/google/connect" className="bloom-btn ml-auto">
              Connect Google Drive
            </a>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--muted)]">
          The portal asks Google only for permission to use files it creates for you — it can never browse the rest of
          your Drive. You can disconnect at any time.
        </p>
      </div>
    </div>
  );
}

import { updateUserAction } from "@/actions/admin";
import { AdminUserForm } from "@/components/AdminUserForm";
import { Modal } from "@/components/Modal";
import { Avatar, PageHeader, RoleBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const users = await getUsers();

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="Roles and portal access"
        text="Council Admins steer the council, Scout Leaders approve advancement, and Scouts earn badges."
        action={
          <Modal title="Invite a member" description="They can sign in right away." trigger="Invite member">
            <AdminUserForm />
          </Modal>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {users.map((person) => (
          <div key={person.id} className="bloom-card flex items-center gap-3 p-4">
            <Avatar name={person.name} color={person.avatarColor} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">{person.name}</p>
              <p className="truncate text-xs text-[var(--muted)]">{person.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={person.role} />
                {person.isActive ? null : <span className="sticker bg-[#ffe0e8]">Paused</span>}
              </div>
            </div>
            <Modal
              title={`Edit ${person.name}`}
              size="sm"
              trigger="Edit"
              triggerClass="bloom-btn secondary"
            >
              <form action={updateUserAction.bind(null, person.id)} className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-extrabold">Role</span>
                  <select className="bloom-select" name="role" defaultValue={person.role}>
                    <option value="student">Scout</option>
                    <option value="teacher">Scout Leader</option>
                    <option value="admin">Council Admin</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-extrabold">Status</span>
                  <select className="bloom-select" name="isActive" defaultValue={person.isActive ? "on" : "off"}>
                    <option value="on">Active</option>
                    <option value="off">Paused</option>
                  </select>
                </label>
                <button className="bloom-btn">Save member</button>
              </form>
            </Modal>
          </div>
        ))}
      </div>
    </div>
  );
}

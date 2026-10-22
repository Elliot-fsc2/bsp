import { RichText } from "@/components/RichText";
import { Avatar, PageHeader, RoleBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getPeople } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await requireUser();
  const people = await getPeople();
  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Who's in the council"
        text="Scouts, Scout Leaders, and the council staff."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <article key={person.id} className="bloom-card p-5">
            <div className="flex items-center gap-3">
              <Avatar name={person.name} color={person.avatarColor} size={52} />
              <div>
                <h2 className="font-display text-xl">{person.name}</h2>
                <RoleBadge role={person.role} />
              </div>
            </div>
            <div className="mt-3 text-sm text-[var(--muted)]">
              <RichText value={person.bio} compact />
            </div>
            <p className="mt-2 text-xs font-bold text-[var(--muted)]">{person.email}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

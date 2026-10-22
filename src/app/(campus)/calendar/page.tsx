import { MonthCalendar, type CalendarEntry } from "@/components/MonthCalendar";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCalendarItems } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  await requireUser();
  const { events } = await getCalendarItems();

  const entries: CalendarEntry[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.startAt.toISOString().slice(0, 10),
    when: formatDate(event.startAt),
    kind: event.type === "holiday" ? "Council holiday" : "Event",
    description: event.description ?? "",
    programName: event.programName ?? "",
  }));

  return (
    <div>
      <PageHeader
        eyebrow="Calendar"
        title="What's happening this month"
        text="Jamborees, campfires, recording days, and service days — all in one trail."
      />
      <MonthCalendar entries={entries} />
    </div>
  );
}

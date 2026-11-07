"use client";

import { useState, useTransition } from "react";
import { CalendarX, Loader2, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Select from "@/components/ui/Select";
import { addBlock, removeBlock } from "@/app/(auth)/dashboard/blockActions";

export interface BlockSummary {
  id: string;
  start_date: string;
  end_date: string | null;
  quantity: number;
  note: string | null;
}

const fmt = (d: string) =>
  new Date(`${d.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function blockLabel(b: Pick<BlockSummary, "start_date" | "end_date">) {
  const today = new Date().toLocaleDateString("en-CA");
  if (!b.end_date) return b.start_date <= today ? "Unavailable until further notice" : `Unavailable from ${fmt(b.start_date)}`;
  return b.start_date <= today ? `Unavailable until ${fmt(b.end_date)}` : `Unavailable ${fmt(b.start_date)}–${fmt(b.end_date)}`;
}

/** "Block dates" button + drawer for one listing. */
export default function BlockDates({
  propId,
  propName,
  totalUnits,
  blocks,
}: {
  propId: string;
  propName: string;
  totalUnits: number;
  blocks: BlockSummary[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost h-8! px-2.5!"
        title="Block dates when this item is rented elsewhere or unavailable"
      >
        <CalendarX className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Block dates</span>
      </button>
      {open && (
        <Drawer title="Block dates" onClose={() => setOpen(false)}>
          <BlockForm propId={propId} propName={propName} totalUnits={totalUnits} blocks={blocks} />
        </Drawer>
      )}
    </>
  );
}

function BlockForm({
  propId,
  propName,
  totalUnits,
  blocks,
}: {
  propId: string;
  propName: string;
  totalUnits: number;
  blocks: BlockSummary[];
}) {
  const today = new Date().toLocaleDateString("en-CA");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");
  const [indefinite, setIndefinite] = useState(false);
  const [quantity, setQuantity] = useState("all");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start_] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!indefinite && !end) {
      setError("Choose an end date, or tick “Until further notice”.");
      return;
    }
    start_(async () => {
      setError(null);
      setSaved(false);
      const result = await addBlock({ propId, start, end: indefinite ? "" : end, quantity, note });
      if (result.error) setError(result.error);
      else {
        setSaved(true);
        setEnd("");
        setNote("");
        setIndefinite(false);
      }
    });
  };

  const remove = (id: string) => {
    setRemovingId(id);
    start_(async () => {
      const result = await removeBlock(id);
      if (result.error) setError(result.error);
      setRemovingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="font-medium">{propName}</p>
        <p className="mt-1 text-sm text-neutral-600">
          Rented it out somewhere else, or need it back? Block those dates so it can&apos;t be
          requested here.
        </p>
      </div>

      {blocks.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Current blocks</h3>
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p>{blockLabel(b)}</p>
                  <p className="text-xs text-neutral-500">
                    {b.quantity >= totalUnits ? "All units" : `${b.quantity} of ${totalUnits} units`}
                    {b.note && <> · {b.note}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(b.id)}
                  disabled={pending}
                  className="shrink-0 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label="Remove block"
                >
                  {removingId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={submit} className="space-y-4">
        <h3 className="text-sm font-semibold">Add a block</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="block-start" className="label">From</label>
            <input
              id="block-start"
              type="date"
              required
              min={today}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="block-end" className="label">Until</label>
            <input
              id="block-end"
              type="date"
              min={start || today}
              value={indefinite ? "" : end}
              disabled={indefinite}
              onChange={(e) => setEnd(e.target.value)}
              className="input disabled:bg-neutral-50 disabled:text-neutral-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={indefinite}
            onChange={(e) => setIndefinite(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
          />
          Until further notice
        </label>

        {totalUnits > 1 && (
          <div>
            <label htmlFor="block-qty" className="label">Units</label>
            <Select id="block-qty" value={quantity} onChange={(e) => setQuantity(e.target.value)}>
              <option value="all">All {totalUnits} units</option>
              {Array.from({ length: totalUnits - 1 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1} {i === 0 ? "unit" : "units"}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label htmlFor="block-note" className="label">
            Note <span className="font-normal text-neutral-500">(optional, only you see this)</span>
          </label>
          <input
            id="block-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. Out on another job"
            className="input"
          />
        </div>

        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        {saved && !pending && <p className="text-sm text-accent" role="status">Dates blocked.</p>}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending && !removingId && <Loader2 className="h-4 w-4 animate-spin" />} Block these dates
        </button>
      </form>
    </div>
  );
}

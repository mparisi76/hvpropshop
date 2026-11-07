"use client";

import { useSyncExternalStore } from "react";

/**
 * Pull list — a browser-local list of saved props.
 * Stored in localStorage and synced across components (and tabs).
 */

export interface PullList {
  name: string;
  prepDate: string;
  wrapDate: string;
  ids: string[];
}

const KEY = "hv-pull-list";
const EMPTY: PullList = { name: "", prepDate: "", wrapDate: "", ids: [] };

let cache: { raw: string | null; value: PullList } = { raw: null, value: EMPTY };
const listeners = new Set<() => void>();

function read(): PullList {
  const raw = localStorage.getItem(KEY);
  if (raw !== cache.raw) {
    let value = EMPTY;
    try {
      const parsed = JSON.parse(raw ?? "");
      if (parsed && Array.isArray(parsed.ids)) {
        value = {
          name: String(parsed.name ?? ""),
          prepDate: String(parsed.prepDate ?? ""),
          wrapDate: String(parsed.wrapDate ?? ""),
          ids: parsed.ids.map(String),
        };
      }
    } catch {
      // Missing or corrupt data — treat as empty
    }
    cache = { raw, value };
  }
  return cache.value;
}

function write(next: PullList) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePullList(): PullList {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const pullList = {
  toggle(id: string) {
    const list = read();
    const ids = list.ids.includes(id)
      ? list.ids.filter((x) => x !== id)
      : [...list.ids, id];
    write({ ...list, ids });
  },
  add(newIds: string[]) {
    const list = read();
    const ids = [...list.ids];
    for (const id of newIds) if (!ids.includes(id)) ids.push(id);
    write({ ...list, ids });
  },
  remove(removeIds: string[]) {
    const list = read();
    write({ ...list, ids: list.ids.filter((x) => !removeIds.includes(x)) });
  },
  update(fields: Partial<Omit<PullList, "ids">>) {
    write({ ...read(), ...fields });
  },
  clear() {
    write(EMPTY);
  },
};

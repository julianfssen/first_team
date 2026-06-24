/**
 * Local save system (localStorage, 3 slots + autosave).
 *
 * All saves live under one localStorage key as an array of SaveSlots, validated
 * with Zod on read. Browser-only — every function guards against SSR.
 */

import type { Career, SaveSlot } from "./types";
import { saveFileSchema } from "./schemas";

const STORAGE_KEY = "first-team:saves:v1";
export const MAX_SLOTS = 3;
export const AUTOSAVE_ID = "autosave";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function nowIso(): string {
  return new Date().toISOString();
}

function readAll(): SaveSlot[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = saveFileSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn("Save file failed validation; ignoring.", parsed.error.issues?.slice(0, 3));
      return [];
    }
    return parsed.data as unknown as SaveSlot[];
  } catch (e) {
    console.warn("Could not parse save file.", e);
    return [];
  }
}

function writeAll(slots: SaveSlot[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

export function listSaves(): SaveSlot[] {
  return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSave(id: string): SaveSlot | undefined {
  return readAll().find((s) => s.id === id);
}

/** Create or overwrite a save slot with the given id. */
export function writeSave(id: string, name: string, career: Career): SaveSlot {
  const slots = readAll();
  const existing = slots.find((s) => s.id === id);
  const slot: SaveSlot = {
    id,
    name,
    version: 1,
    career,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  const next = slots.filter((s) => s.id !== id);
  next.push(slot);
  writeAll(next);
  return slot;
}

export function autosave(career: Career): SaveSlot {
  return writeSave(AUTOSAVE_ID, `${career.player.name} (Autosave)`, career);
}

/** Manual save into one of the numbered slots (slot-1 .. slot-3). */
export function saveToSlot(slotIndex: number, career: Career): SaveSlot {
  const id = `slot-${slotIndex}`;
  return writeSave(id, career.player.name, career);
}

export function deleteSave(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function manualSlotIds(): string[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) => `slot-${i + 1}`);
}

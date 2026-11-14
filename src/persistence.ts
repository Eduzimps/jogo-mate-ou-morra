import { load, type Save } from "./data";
export const SAVE_KEY = "sky-strike";
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function readProgress(storage: StorageLike): {
  save?: Save;
  error?: string;
  raw: string | null;
} {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
    const save = load(raw);
    if (raw && JSON.parse(raw).version === 1) {
      storage.setItem(SAVE_KEY + ".backup-v1", raw);
    }
    return { save, raw };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Não foi possível acessar o progresso.",
      raw,
    };
  }
}
export function importProgress(raw: string, storage: StorageLike): Save {
  const save = load(raw);
  const old = storage.getItem(SAVE_KEY);
  if (old) storage.setItem(SAVE_KEY + ".before-import", old);
  storage.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}

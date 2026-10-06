export type Toast = { id: number; message: string; kind: "success" | "error" };

let current: Toast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

export function getToast(): Toast | null {
  return current;
}

export function showToast(
  message: string,
  kind: Toast["kind"] = "success",
): void {
  current = { id: nextId++, message, kind };
  listeners.forEach((fn) => fn());
}

export function dismissToast(): void {
  current = null;
  listeners.forEach((fn) => fn());
}

export function subscribeToast(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

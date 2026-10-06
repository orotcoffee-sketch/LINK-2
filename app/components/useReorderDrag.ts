"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";

// 이 거리(px) 이상 움직여야 드래그로 인정한다.
const DRAG_THRESHOLD = 5;

type Drop = { id: string; after: boolean };

type Options = {
  group: string;
  ids: string[];
  enabled: boolean;
  axis: "x" | "y";
  onReorder: (ids: string[]) => void;
};

// 항목의 일반 영역을 누른 채 움직여 순서를 바꾸는 공통 훅 (폴더, 링크 카드 공용).
// 버튼 등 드래그 제외 요소에는 data-no-drag 속성을 붙인다.
export function useReorderDrag({ group, ids, enabled, axis, onReorder }: Options) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const latest = useRef({ ids, onReorder });
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current = { ids, onReorder };
  });
  useEffect(() => () => cleanup.current?.(), []);

  function startPress(id: string, e: PointerEvent) {
    if (!enabled || e.button !== 0 || e.pointerType !== "mouse") return;
    if ((e.target as Element).closest("[data-no-drag]")) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let started = false;
    let current: Drop | null = null;

    const move = (ev: globalThis.PointerEvent) => {
      if (!started) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) {
          return;
        }
        started = true;
        setDragId(id);
        document.body.classList.add("is-reordering");
        window.getSelection()?.removeAllRanges();
      }
      const el = document
        .elementFromPoint(ev.clientX, ev.clientY)
        ?.closest<HTMLElement>(`[data-reorder-group="${group}"]`);
      const overId = el?.dataset.reorderId;
      if (!el || !overId) return; // 항목 사이 빈틈에서는 마지막 위치를 유지한다.
      if (overId === id) {
        current = null;
        setDrop(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const after =
        axis === "x"
          ? ev.clientX > r.left + r.width / 2
          : ev.clientY > r.top + r.height / 2;
      if (current?.id !== overId || current.after !== after) {
        current = { id: overId, after };
        setDrop(current);
      }
    };

    const finish = (commit: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      document.body.classList.remove("is-reordering");
      cleanup.current = null;
      if (!started) return;

      // 드래그 직후 발생하는 click(폴더 선택, 링크 열기)을 막는다.
      const block = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      window.addEventListener("click", block, { capture: true, once: true });
      setTimeout(() => window.removeEventListener("click", block, true), 0);

      if (commit && current) {
        const order = latest.current.ids.filter((x) => x !== id);
        order.splice(order.indexOf(current.id) + (current.after ? 1 : 0), 0, id);
        // 순서가 그대로면 저장하지 않는다.
        if (order.join() !== latest.current.ids.join()) {
          latest.current.onReorder(order);
        }
      }
      setDragId(null);
      setDrop(null);
    };
    const up = () => finish(true);
    const cancel = () => finish(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    cleanup.current = () => finish(false);
  }

  // 항목(li)에 펼쳐서 사용한다.
  function itemProps(id: string, extraClass = "") {
    const state =
      dragId === id
        ? "reorder-dragging"
        : dragId && drop?.id === id
          ? `drop-${drop.after ? "after" : "before"}-${axis}`
          : "";
    return {
      "data-reorder-id": id,
      "data-reorder-group": group,
      onPointerDown: (e: PointerEvent) => startPress(id, e),
      // 링크 등의 브라우저 기본 드래그가 pointer 이벤트를 끊지 않게 한다.
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
      className: `${enabled ? "reorder-item" : ""} ${state} ${extraClass}`.trim(),
    };
  }

  return { itemProps };
}

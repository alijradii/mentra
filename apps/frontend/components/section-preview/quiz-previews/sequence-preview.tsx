"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import type { SequenceQuizSectionDTO } from "@/lib/api";
import { shuffle } from "../utils";
import { ResultBanner } from "../result-banner";

function SortableItem({ id, text, locked }: { id: string; text: string; locked: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: locked });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`px-4 py-3 rounded-lg border-2 text-sm select-none ${
        locked
          ? "border-muted bg-muted/30 text-muted-foreground cursor-default"
          : "border-border bg-card cursor-grab active:cursor-grabbing hover:bg-background"
      }`}
    >
      {locked && <span className="text-xs text-muted-foreground mr-2">(fixed)</span>}
      {text}
    </div>
  );
}

interface SequencePreviewProps {
  section: SequenceQuizSectionDTO;
}

export function SequencePreview({ section }: SequencePreviewProps) {
  const prefilledSet = useMemo(
    () => new Set((section.prefilledPositions ?? []).map((p) => p.itemId)),
    [section.prefilledPositions]
  );

  const initialOrder = useMemo(() => {
    const locked = new Map((section.prefilledPositions ?? []).map((p) => [p.position, p.itemId]));
    const unlocked = shuffle(section.items.filter((it) => !prefilledSet.has(it.id)).map((it) => it.id));
    const result: string[] = [];
    let ui = 0;
    for (let pos = 0; pos < section.items.length; pos++) {
      if (locked.has(pos)) {
        result.push(locked.get(pos)!);
      } else {
        result.push(unlocked[ui++]);
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [order, setOrder] = useState<string[]>(initialOrder);
  const [submitted, setSubmitted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (submitted) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (prefilledSet.has(String(active.id)) || prefilledSet.has(String(over.id))) return;
    setOrder((prev) => {
      const oldIdx = prev.indexOf(String(active.id));
      const newIdx = prev.indexOf(String(over.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const isCorrect = submitted && order.every((id, i) => section.correctOrder[i] === id);
  const itemMap = useMemo(() => new Map(section.items.map((it) => [it.id, it.text])), [section.items]);

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {order.map((id) => (
              <SortableItem key={id} id={id} text={itemMap.get(id) ?? ""} locked={prefilledSet.has(id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {!submitted ? (
        <Button size="sm" onClick={() => setSubmitted(true)}>
          Check answer
        </Button>
      ) : (
        <ResultBanner correct={isCorrect} explanation={section.explanation} />
      )}
    </>
  );
}

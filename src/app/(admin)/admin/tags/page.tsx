"use client";

import { useEffect, useMemo, useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePublicTags } from "@/lib/query/useTags";
import { useToggleTagVisibility, useReorderTags } from "@/lib/query/useAdminTags";
import type { TagRecord } from "@/lib/api/types";

export default function HomeTagsPage() {
  const { data: tags } = usePublicTags();
  const toggleVisibility = useToggleTagVisibility();
  const reorderTags = useReorderTags();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<TagRecord[]>([]);

  useEffect(() => {
    if (tags) {
      setOrder([...tags].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)));
    }
  }, [tags]);

  const filtered = useMemo(
    () =>
      order.filter((t) =>
        `${t.label} ${t.tagKey}`.toLowerCase().includes(query.toLowerCase())
      ),
    [order, query]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((t) => t.tagKey === active.id);
    const newIndex = order.findIndex((t) => t.tagKey === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    reorderTags.mutate(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl italic">Home tags</h1>
        <p className="mt-1 text-sm text-muted">
          Controls which subject tiles appear on the home page, and in what order.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tags…"
        className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={filtered.map((t) => t.tagKey)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-border border-y border-border">
            {filtered.map((tag) => (
              <TagRow
                key={tag.tagKey}
                tag={tag}
                onToggle={() => toggleVisibility.mutate(tag)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function TagRow({ tag, onToggle }: { tag: TagRecord; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tag.tagKey });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center justify-between gap-4 bg-background py-3 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="cursor-grab px-1 text-muted active:cursor-grabbing"
        >
          ⠿
        </button>
        <span className="text-sm">{tag.label}</span>
      </div>

      <Switch.Root
        checked={tag.showOnHome}
        onCheckedChange={onToggle}
        className="relative h-5 w-9 rounded-full bg-border data-[state=checked]:bg-accent"
      >
        <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-4" />
      </Switch.Root>
    </li>
  );
}

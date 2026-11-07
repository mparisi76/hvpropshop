/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, X } from "lucide-react";

export interface GridPhoto {
  key: string;
  url: string;
}

/**
 * Sortable photo grid. Drag with the mouse, press-and-hold on touch screens,
 * or focus a photo and use Space + arrow keys. The first photo is the main one.
 */
export default function PhotoGrid<T extends GridPhoto>({
  photos,
  onChange,
  onRemove,
  children,
}: {
  photos: T[];
  onChange: (photos: T[]) => void;
  onRemove: (key: string) => void;
  /** Extra tiles after the photos (e.g. the "Add photos" button) */
  children?: React.ReactNode;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const indexOf = (key: string) => photos.findIndex((p) => p.key === key);

  const onDragStart = (e: DragStartEvent) => setActiveKey(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveKey(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange(arrayMove(photos, indexOf(String(active.id)), indexOf(String(over.id))));
  };

  const makeMain = (key: string) => onChange(arrayMove(photos, indexOf(key), 0));

  const active = activeKey ? photos.find((p) => p.key === activeKey) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveKey(null)}
    >
      <SortableContext items={photos.map((p) => p.key)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((p, i) => (
            <SortablePhoto
              key={p.key}
              photo={p}
              isMain={i === 0}
              onMakeMain={() => makeMain(p.key)}
              onRemove={() => onRemove(p.key)}
            />
          ))}
          {children}
        </div>
      </SortableContext>

      {/* The photo that follows the pointer while dragging */}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active ? (
          <div className="aspect-4/3 cursor-grabbing overflow-hidden rounded-md border border-neutral-300 bg-neutral-100 shadow-xl ring-1 ring-black/5">
            <img src={active.url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortablePhoto({
  photo,
  isMain,
  onMakeMain,
  onRemove,
}: {
  photo: GridPhoto;
  isMain: boolean;
  onMakeMain: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.key,
  });

  // Don't let presses on the buttons start a drag
  const stop = (e: React.PointerEvent | React.MouseEvent | React.TouchEvent | React.KeyboardEvent) =>
    e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${isMain ? "Main photo" : "Photo"}. Press space to pick up, arrow keys to move.`}
      className={`relative aspect-4/3 cursor-grab touch-manipulation select-none overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <img src={photo.url} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />

      {isMain ? (
        <span className="absolute left-1.5 top-1.5 rounded bg-neutral-900 px-1.5 py-0.5 text-[11px] font-medium text-white">
          Main
        </span>
      ) : (
        <button
          type="button"
          onClick={onMakeMain}
          onPointerDown={stop}
          onMouseDown={stop}
          onTouchStart={stop}
          onKeyDown={stop}
          className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700 shadow-sm hover:text-neutral-900"
        >
          <Star className="h-3 w-3" aria-hidden /> Make main
        </button>
      )}
      <button
        type="button"
        onClick={onRemove}
        onPointerDown={stop}
        onMouseDown={stop}
        onTouchStart={stop}
        onKeyDown={stop}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded bg-white/95 text-neutral-600 shadow-sm hover:text-neutral-900"
        aria-label="Remove photo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

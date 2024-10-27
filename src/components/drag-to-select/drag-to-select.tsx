import { PointerEvent, useRef, useState } from "react";
import styles from "./styles.module.scss";
import { DOMVector } from "./dom-vector";
import cn from "classnames";

const items = Array(30)
  .fill(null)
  .map((_, idx) => idx + 1);

function intersect(rect1: DOMRect, rect2: DOMRect) {
  if (rect1.right < rect2.left || rect2.right < rect1.left) return false;

  if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false;

  return true;
}

export const DragToSelect = () => {
  const [dragVector, setDragVector] = useState<DOMVector | null>(null);
  const selectionRect = dragVector?.toDOMRect();
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSelectedItems = (dragVector: DOMVector) => {
    if (containerRef.current == null) return;

    const next: Record<string, boolean> = {};
    const containerRect = containerRef.current.getBoundingClientRect();

    containerRef.current?.querySelectorAll("[data-item]").forEach((item) => {
      if (!(item instanceof HTMLElement)) {
        return;
      }

      const itemRect = item.getBoundingClientRect();
      const x = itemRect.x - containerRect.x;
      const y = itemRect.y - containerRect.y;
      const translatedItemRect = new DOMRect(
        x,
        y,
        itemRect.width,
        itemRect.height
      );

      if (!intersect(dragVector.toDOMRect(), translatedItemRect)) {
        return;
      }

      if (item.dataset.item && typeof item.dataset.item === "string") {
        next[item.dataset.item] = true;
      }
    });

    setSelectedItems(next);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const containerRect = event.currentTarget.getBoundingClientRect();

    setDragVector(
      new DOMVector(
        event.clientX - containerRect.x,
        event.clientY - containerRect.y,
        0,
        0
      )
    );
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragVector === null) {
      return;
    }

    const containerRect = event.currentTarget.getBoundingClientRect();

    const nextDragVector = new DOMVector(
      dragVector.x,
      dragVector.y,
      event.clientX - containerRect.x - dragVector.x,
      event.clientY - containerRect.y - dragVector.y
    );

    setDragVector(nextDragVector);
    updateSelectedItems(nextDragVector);
  };

  const handlePointerUp = () => {
    setDragVector(null);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <span>поле выбора с селектом</span>
        {Object.keys(selectedItems).length > 0 && (
          <span>Количество: {Object.keys(selectedItems).length}</span>
        )}
      </div>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={styles.area}
      >
        {items.map((item) => (
          <div
            key={item}
            data-item={item}
            className={cn(styles.areaItem, {
              [styles.selectedAreaItem]: selectedItems[item],
            })}
          >
            {item}
          </div>
        ))}
        {selectionRect && (
          <div
            className={styles.selectionRect}
            style={{
              left: selectionRect.x,
              top: selectionRect.y,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          />
        )}
      </div>
    </div>
  );
};

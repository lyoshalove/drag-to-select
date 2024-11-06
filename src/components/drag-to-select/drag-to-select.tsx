import {
  KeyboardEvent,
  PointerEvent,
  UIEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./styles.module.scss";
import { DOMVector } from "./dom-vector";
import cn from "classnames";

const items = Array(300)
  .fill(null)
  .map((_, idx) => idx + 1);

function intersect(rect1: DOMRect, rect2: DOMRect) {
  if (rect1.right < rect2.left || rect2.right < rect1.left) return false;

  if (rect1.bottom < rect2.top || rect2.bottom < rect1.top) return false;

  return true;
}

function shallowEqual(x: Record<string, boolean>, y: Record<string, boolean>) {
  return (
    Object.keys(x).length === Object.keys(y).length &&
    Object.keys(x).every((key) => x[key] === y[key])
  );
}

export const DragToSelect = () => {
  const [dragVector, setDragVector] = useState<DOMVector | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null);
  const selectionRect =
    dragVector && scrollVector && isDragging && containerRef.current
      ? dragVector
          .add(scrollVector)
          .clamp(
            new DOMRect(
              0,
              0,
              containerRef.current.scrollWidth,
              containerRef.current.scrollHeight
            )
          )
          .toDOMRect()
      : null;

  const updateSelectedItems = useCallback(
    (dragVector: DOMVector, scrollVector: DOMVector) => {
      if (containerRef.current == null) return;
      const next: Record<string, boolean> = {};
      const containerRect = containerRef.current.getBoundingClientRect();
      containerRef.current.querySelectorAll("[data-item]").forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        if (containerRef.current == null) return;

        const itemRect = el.getBoundingClientRect();
        const translatedItemRect = new DOMRect(
          itemRect.x - containerRect.x + containerRef.current.scrollLeft,
          itemRect.y - containerRect.y + containerRef.current.scrollTop,
          itemRect.width,
          itemRect.height
        );

        if (
          !intersect(
            dragVector.add(scrollVector).toDOMRect(),
            translatedItemRect
          )
        )
          return;

        if (el.dataset.item && typeof el.dataset.item === "string") {
          next[el.dataset.item] = true;
        }
      });
      if (!shallowEqual(next, selectedItems)) {
        setSelectedItems(next);
      }
    },
    [selectedItems]
  );

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

    event.currentTarget.setPointerCapture(event.pointerId);

    setScrollVector(
      new DOMVector(
        event.currentTarget.scrollLeft,
        event.currentTarget.scrollTop,
        0,
        0
      )
    );
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragVector === null || scrollVector === null) {
      return;
    }

    const containerRect = event.currentTarget.getBoundingClientRect();

    const nextDragVector = new DOMVector(
      dragVector.x,
      dragVector.y,
      event.clientX - containerRect.x - dragVector.x,
      event.clientY - containerRect.y - dragVector.y
    );

    if (!isDragging && nextDragVector.getDiagonalLength() < 10) {
      return;
    }

    setIsDragging(true);

    containerRef.current?.focus();

    setDragVector(nextDragVector);
    updateSelectedItems(nextDragVector, scrollVector);
  };

  const handlePointerUp = () => {
    if (!isDragging) {
      setSelectedItems({});
      setDragVector(null);
    } else {
      setDragVector(null);
      setIsDragging(false);
    }

    setScrollVector(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSelectedItems({});
      setDragVector(null);
    }

    setScrollVector(null);
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (dragVector === null || scrollVector === null) {
      return;
    }

    const { scrollLeft, scrollTop } = event.currentTarget;

    const nextScrollVector = new DOMVector(
      scrollVector.x,
      scrollVector.y,
      scrollLeft - scrollVector.x,
      scrollTop - scrollVector.y
    );

    setScrollVector(nextScrollVector);
    updateSelectedItems(dragVector, nextScrollVector);
  };

  useEffect(() => {
    if (!isDragging || containerRef.current == null) return;

    let handle = requestAnimationFrame(scrollTheLad);

    return () => cancelAnimationFrame(handle);

    function clamp(num: number, min: number, max: number) {
      return Math.min(Math.max(num, min), max);
    }

    function scrollTheLad() {
      if (containerRef.current == null || dragVector == null) return;

      const currentPointer = dragVector.toTerminalPoint();
      const containerRect = containerRef.current.getBoundingClientRect();

      const shouldScrollRight = containerRect.width - currentPointer.x < 20;
      const shouldScrollLeft = currentPointer.x < 20;
      const shouldScrollDown = containerRect.height - currentPointer.y < 20;
      const shouldScrollUp = currentPointer.y < 20;

      const left = shouldScrollRight
        ? clamp(20 - containerRect.width + currentPointer.x, 0, 15)
        : shouldScrollLeft
        ? -1 * clamp(20 - currentPointer.x, 0, 15)
        : undefined;

      const top = shouldScrollDown
        ? clamp(20 - containerRect.height + currentPointer.y, 0, 15)
        : shouldScrollUp
        ? -1 * clamp(20 - currentPointer.y, 0, 15)
        : undefined;

      if (top === undefined && left === undefined) {
        handle = requestAnimationFrame(scrollTheLad);
        return;
      }

      containerRef.current.scrollBy({
        left,
        top,
      });

      handle = requestAnimationFrame(scrollTheLad);
    }
  }, [isDragging, dragVector, updateSelectedItems]);

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
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        className={styles.area}
        tabIndex={-1}
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

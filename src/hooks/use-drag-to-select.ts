import { DOMVector } from "@/lib";
import { clamp, intersect, shallowEqual } from "@/utils";
import {
  KeyboardEvent,
  PointerEvent,
  RefObject,
  UIEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

export const useDragToSelect = (containerRef: RefObject<HTMLDivElement>) => {
  const [dragVector, setDragVector] = useState<DOMVector | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [scrollVector, setScrollVector] = useState<DOMVector | null>(null);
  const isShowSelectionRect =
    dragVector && scrollVector && isDragging && containerRef.current;
  const selectionRect = isShowSelectionRect
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
      if (containerRef.current == null) {
        return;
      }

      const next: Record<string, boolean> = {};
      const containerRect = containerRef.current.getBoundingClientRect();

      containerRef.current.querySelectorAll("[data-item]").forEach((el) => {
        if (!(el instanceof HTMLElement) || containerRef.current == null) {
          return;
        }

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
        ) {
          return;
        }

        if (el.dataset.item && typeof el.dataset.item === "string") {
          next[el.dataset.item] = true;
        }
      });

      if (!shallowEqual(next, selectedItems)) {
        setSelectedItems(next);
      }
    },
    [containerRef, selectedItems]
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
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
    },
    [containerRef, dragVector, isDragging, scrollVector, updateSelectedItems]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) {
      setSelectedItems({});
    } else {
      setIsDragging(false);
    }

    setDragVector(null);
    setScrollVector(null);
  }, [isDragging]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSelectedItems({});
      setDragVector(null);
    }

    setScrollVector(null);
  }, []);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
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
    },
    [dragVector, scrollVector, updateSelectedItems]
  );

  useEffect(() => {
    if (!isDragging || containerRef.current == null) {
      return;
    }

    let handle = requestAnimationFrame(scrollTheLad);

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

    return () => cancelAnimationFrame(handle);
  }, [isDragging, dragVector, updateSelectedItems, containerRef]);

  return {
    selectedItems,
    selectionRect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleScroll,
  };
};

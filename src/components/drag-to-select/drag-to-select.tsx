import { useRef } from "react";
import styles from "./styles.module.scss";
import cn from "classnames";
import { useDragToSelect } from "@/hooks";

const items = Array(300)
  .fill(null)
  .map((_, idx) => idx + 1);

export const DragToSelect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    selectedItems,
    selectionRect,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleKeyDown,
    handleScroll,
  } = useDragToSelect(containerRef);

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

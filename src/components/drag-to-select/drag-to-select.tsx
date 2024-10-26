import styles from "./styles.module.scss";

const items = Array(30)
  .fill(null)
  .map((_, idx) => idx + 1);

export const DragToSelect = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>поле выбора с селектом</div>
      <div className={styles.area}>
        {items.map((item) => (
          <div key={item} className={styles.areaItem}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

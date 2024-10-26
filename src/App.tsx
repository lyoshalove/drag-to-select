import styles from "./App.module.scss";
import { DragToSelect } from "./components";

export const App = () => (
  <main className={styles.main}>
    <DragToSelect />
  </main>
);

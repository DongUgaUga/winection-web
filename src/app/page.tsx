import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Link href={'/ts'}>ts</Link>
      &nbsp;
      <Link href={'/stsl'}>stsl</Link>
      &nbsp;
      <Link href={'/slts'}>slts</Link>     
    </div>
  );
}

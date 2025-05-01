import styles from './Footer.module.scss';

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<div className={styles.footer}>
			COPYRIGHT &copy; {currentYear} BY DongUgaUga
		</div>
	);
}

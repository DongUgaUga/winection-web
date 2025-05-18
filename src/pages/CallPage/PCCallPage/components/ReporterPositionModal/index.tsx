import AlertIcon from 'src/assets/alert.svg';
import styles from './ReporterPosition.module.scss';
import NaverMap from '@/pages/CallPage/components/NaverMap';

export default function ReporterPositionModal({
	setIsModalOpen,
	address,
}: {
	setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	address: string;
}) {
	return (
		<div className={styles.background}>
			<div className={styles.container}>
				<h1 className={styles.container__title}>
					<AlertIcon />
					신고자 현재 위치
				</h1>
				<div className={styles.container__map}>
					<NaverMap address={address} />
				</div>
				<button
					className={styles.container__button}
					onClick={() => setIsModalOpen(false)}
				>
					닫기
				</button>
			</div>
		</div>
	);
}

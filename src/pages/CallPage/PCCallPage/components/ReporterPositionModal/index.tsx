import AlertIcon from 'src/assets/alert.svg';
import styles from './ReporterPosition.module.scss';
import NaverMap from '@/pages/CallPage/components/NaverMap';

export default function ReporterPositionModal({
	setIsModalOpen,
	address,
	latitude,
	longitude,
}: {
	setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	address?: string;
	latitude?: number;
	longitude?: number;
}) {
	return (
		<div className={styles.background}>
			<div className={styles.container}>
				<h1 className={styles.container__title}>
					<AlertIcon />
					신고자 현재 위치
				</h1>
				<div className={styles.container__map}>
					<NaverMap
						address={address}
						coordinates={
							latitude
								? {
										lat: latitude,
										lng: longitude,
									}
								: undefined
						}
					/>
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

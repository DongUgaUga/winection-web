import AlertIcon from 'src/assets/alert.svg';
import styles from './EmergencyReportModal.module.scss';

// 사용자 정보 props로 받을 예정(위치, 닉네임, 전화번호 등..)
export default function EmergencyReportModal({
	setIsModalOpen,
}: {
	setIsModalOpen: (value: React.SetStateAction<boolean>) => void;
}) {
	const receiveReport = () => {
		// todo 신고 접수를 하면 농인과 연결 시작
		setIsModalOpen(false);
	};

	return (
		<div className={styles.background}>
			<div className={styles.container}>
				<h1 className={styles.container__title}>
					<AlertIcon />
					<div>신고발생</div>
				</h1>
				<div className={styles.content}>
					<div className={styles.content__map}>지도</div>
					<div className={styles.content__infos}>
						<div className={styles['content__info-box']}>
							<div className={styles['content__info-box--label']}>닉네임</div>
							<div className={styles['content__info-box--value']}>가드닝</div>
						</div>
						<div className={styles['content__info-box']}>
							<div className={styles['content__info-box--label']}>
								사용자 전화번호
							</div>
							<div className={styles['content__info-box--value']}>
								010-1234-5678
							</div>
						</div>
						<div className={styles['content__info-box']}>
							<div className={styles['content__info-box--label']}>
								사용자 현재 위치
							</div>
							<div className={styles['content__info-box--value']}>
								ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ
							</div>
						</div>
					</div>
				</div>
				<button className={styles.container__button} onClick={receiveReport}>
					접수하기
				</button>
			</div>
		</div>
	);
}

import { useState } from 'react';
import AlertIcon from 'src/assets/alert.svg';
import NaverMap from '../NaverMap';
import styles from './EmergencyReportModal.module.scss';

interface EmergencyReportModalProps {
	setIsModalOpen: (value: boolean) => void;
	userDetailInfo: {
		nickname: string;
		phoneNumber: string;
		latitude: number;
		longitude: number;
	};
}

export default function EmergencyReportModal({
	setIsModalOpen,
	userDetailInfo,
}: EmergencyReportModalProps) {
	// todo 서버에서 상대 위도, 경도값 받아오는 api 추가 시 삭제 예정
	const [locationInfo, setLocationInfo] = useState({
		roadAddress: '',
		jibunAddress: '',
		lat: 0,
		lng: 0,
	});

	const handleLocationUpdate = (info: typeof locationInfo) => {
		setLocationInfo(info);
	};

	const receiveReport = () => {
		// TODO: roomId 등을 signaling 서버에 emit
		setIsModalOpen(false);
	};
	console.log(locationInfo);

	return (
		<div className={styles.background}>
			<div className={styles.container}>
				<h1 className={styles.container__title}>
					<AlertIcon />
					<span>신고 발생</span>
				</h1>

				<div className={styles.content}>
					<div className={styles.content__map}>
						<NaverMap
							coordinates={{
								lat: userDetailInfo.latitude,
								lng: userDetailInfo.longitude,
							}}
							onLocationUpdate={handleLocationUpdate}
						/>
					</div>
					<div className={styles.content__infos}>
						<InfoRow label="닉네임" value={userDetailInfo.nickname} />
						<InfoRow
							label="사용자 전화번호"
							value={userDetailInfo.phoneNumber}
						/>
						<InfoRow
							label="사용자 현재 위치"
							value={
								locationInfo.roadAddress ||
								locationInfo.jibunAddress ||
								'위치 불러오는 중...'
							}
						/>
					</div>
				</div>

				<button className={styles.container__button} onClick={receiveReport}>
					접수하기
				</button>
			</div>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className={styles['content__info-box']}>
			<div className={styles['content__info-box--label']}>{label}</div>
			<div className={styles['content__info-box--value']}>{value}</div>
		</div>
	);
}

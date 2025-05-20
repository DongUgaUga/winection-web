import { useState } from 'react';
import AlertIcon from 'src/assets/alert.svg';
import NaverMap from '../NaverMap';
import styles from './EmergencyReportModal.module.scss';

interface EmergencyReportModalProps {
	setIsModalOpen: (value: boolean) => void;
	userDetailInfo: {
		userId: number;
		nickname: string;
		phoneNumber: string;
		latitude?: number;
		longitude?: number;
		address?: string;
	};
	socket?: WebSocket | null;
}

export default function EmergencyReportModal({
	setIsModalOpen,
	userDetailInfo,
	socket,
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
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(
				JSON.stringify({
					type: 'acceptCall',
					data: { user_id: userDetailInfo.userId },
				}),
			);
			setIsModalOpen(false);
		} else {
			console.error('❌ WebSocket이 연결되어 있지 않음');
		}
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
							coordinates={
								userDetailInfo.latitude !== undefined &&
								userDetailInfo.longitude !== undefined
									? {
											lat: userDetailInfo.latitude,
											lng: userDetailInfo.longitude,
										}
									: undefined
							}
							address={
								userDetailInfo.latitude === undefined && userDetailInfo.address
									? userDetailInfo.address
									: undefined
							}
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

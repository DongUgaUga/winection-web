import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import GraySearchIcon from 'src/assets/search-gray.svg';
import ReporterPositionModal from '../ReporterPositionModal';
import styles from './OpponentInformation.module.scss';
import { formatKoreanDate } from '@/utils/functions/formatTime';
import { useDeafInfoStore } from '@/utils/zustand/deafInfo';
import { useEmergencyInfoStore } from '@/utils/zustand/emergencyInfo';

interface OpponentInformationProps {
	callType: 'general' | 'emergency';
	peerStatus: boolean;
	peerNickname: string;
	peerType: string;
	startTime: string;
}

export default function OpponentInformation({
	callType,
	peerStatus,
	peerNickname,
	peerType,
	startTime,
}: OpponentInformationProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const callStartTime = formatKoreanDate(startTime, 'digit');
	const { deafAddress, deafPhoneNumber } = useDeafInfoStore();
	const { emergencyName, emergencyAddress, emergencyPhoneNumber } =
		useEmergencyInfoStore();

	const openMap = () => {
		setIsModalOpen(true);
	};

	return (
		<>
			{callType === 'general' && (
				<div
					className={cn({
						[styles.opponent]: true,
						[styles['opponent--flex']]: true,
						[styles['opponent--hidden']]: !peerStatus,
					})}
				>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							상대방 닉네임
						</div>
						<div className={styles['opponent__content--text']}>
							{peerNickname} <span>({peerType})</span>
						</div>
					</div>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							통화 시작 시간
						</div>
						<div className={styles['opponent__content--text']}>
							{callStartTime}
						</div>
					</div>
				</div>
			)}
			{callType === 'emergency' && (
				<div
					className={cn({
						[styles.opponent]: true,
						[styles['opponent--grid']]: true,
					})}
				>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							상대방 닉네임
						</div>
						{peerStatus ? (
							<div className={styles['opponent__content--text']}>
								{peerType === '응급기관' ? (
									<div>{emergencyName}</div>
								) : (
									<>
										{peerNickname} <span>({peerType})</span>
									</>
								)}
							</div>
						) : (
							<div className={styles['opponent__content--text']}>...</div>
						)}
					</div>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							상대방 연락처
						</div>
						{peerStatus ? (
							<div className={styles['opponent__content--text']}>
								{deafPhoneNumber || emergencyPhoneNumber}
							</div>
						) : (
							<div className={styles['opponent__content--text']}>...</div>
						)}
					</div>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							통화 시작 시간
						</div>
						{peerStatus ? (
							<div className={styles['opponent__content--text']}>
								{callStartTime}
							</div>
						) : (
							<div className={styles['opponent__content--text']}>...</div>
						)}
					</div>
					<div className={styles.opponent__content}>
						<div className={styles['opponent__content--title']}>
							상대방 현재 위치
						</div>
						{peerStatus ? (
							<div>
								<div className={styles['opponent__content--text']}>
									{deafAddress || emergencyAddress}
								</div>
								<button
									className={styles['opponent__content--open-map']}
									onClick={openMap}
								>
									<GraySearchIcon />
									자세히 보기...
								</button>
							</div>
						) : (
							<div className={styles['opponent__content--text']}>...</div>
						)}
					</div>
				</div>
			)}
			{isModalOpen && (
				<ReporterPositionModal
					setIsModalOpen={setIsModalOpen}
					address={deafAddress || emergencyAddress}
				/>
			)}
		</>
	);
}

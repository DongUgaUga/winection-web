import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import GraySearchIcon from 'src/assets/search-gray.svg';
import ReporterPositionModal from '../ReporterPositionModal';
import styles from './OpponentInformation.module.scss';

interface OpponentInformationProps {
	callType: 'general' | 'emergency';
	peerStatus: boolean;
	callStartTime: string | null;
}

export default function OpponentInformation({
	callType,
	peerStatus,
	callStartTime,
}: OpponentInformationProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);

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
							동동우동이 <span>(농인)</span>
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
								동동우동이 <span>(농인)</span>
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
								010-1234-5678
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
									충청남도 아산시 모종로 21
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
			{isModalOpen && <ReporterPositionModal setIsModalOpen={setIsModalOpen} />}
		</>
	);
}

import { useLocation, useNavigate } from 'react-router-dom';
import RecordIcon from 'src/assets/record.svg';
import ReturnIcon from 'src/assets/return.svg';
import useUserInfo from '../../hooks/useUserInfo';
import styles from './CallEndPage.module.scss';
import { formatKoreanDate } from '@/utils/functions/formatTime';
import { useStartTimeStore } from '@/utils/zustand/callTime';

export default function CallEndPage() {
	const { data: userInfo } = useUserInfo();
	const { startTime } = useStartTimeStore();
	const callStartTime = formatKoreanDate(startTime, 'korean');

	const location = useLocation();
	const navigate = useNavigate();
	const callTimeState = location.state;

	return (
		<div className={styles.container}>
			<div className={styles.guide}>
				<div>연결이 종료되었습니다.</div>
				<div>
					<span>{userInfo!.nickname}</span>님, 통화는 어떠셨나요?
				</div>
			</div>
			<div className={styles.call}>
				<div className={styles.call__time}>
					<span>통화 시작 시간</span>
					<div>{callStartTime}</div>
				</div>
				<div className={styles.call__time}>
					<span>통화 지속 시간</span>
					<div>{callTimeState.callTime}</div>
				</div>
			</div>
			<div className={styles['return-container']}>
				<button
					className={styles['return-container__return']}
					onClick={() => navigate('/')}
				>
					<div>메인페이지로</div>
					<ReturnIcon />
				</button>
				{userInfo!.user_type === '응급기관' && (
					<button
						className={styles['return-container__return']}
						onClick={() => navigate('/emergency-call/99999')}
					>
						<div>신고 접수 대기하기</div>
						<RecordIcon />
					</button>
				)}
			</div>
		</div>
	);
}

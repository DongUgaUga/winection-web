import { cn } from '@bcsdlab/utils';
import { useNavigate } from 'react-router-dom';
import useUserInfo from '../../../hooks/useUserInfo';
import WinectionLogo from '/src/assets/winection.svg';
import useBreakpoint from '../../../utils/hooks/useBreakPoint';
import styles from './LoginView.module.scss';

export default function LoginView() {
	const navigate = useNavigate();
	const breakPoint = useBreakpoint();
	const { data: userInfo } = useUserInfo();
	const userClassification = userInfo!.user_type;

	const startCall = () => {
		if (userClassification === '청인') {
			navigate('/general-call');
		} else {
			navigate(`/emergency-call/${userInfo?.emergency_code}`);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.motto}>
				{breakPoint === 'mobile' ? (
					<WinectionLogo />
				) : (
					<>
						<div>오늘도 우리는,</div>
						<div>
							<span className={styles.emphasize}>소통</span>
							<span className={styles.gradient}>을 위해 달려나갑니다.</span>
						</div>
					</>
				)}
				{userClassification === '농인' ? (
					<div className={styles.call}>
						<div className={styles['call__type']}>
							<button
								className={styles.call__button}
								onClick={() => navigate('/general-call')}
							>
								영상통화
							</button>
						</div>
						<div className={styles['call__type']}>
							<button
								className={styles.call__button}
								onClick={() => navigate('/emergency-call')}
							>
								긴급통화
							</button>
						</div>
					</div>
				) : (
					<div className={styles['general-call']}>
						<button
							className={cn({
								[styles.call__button]: true,
								[styles['call__button--start']]: true,
							})}
							onClick={startCall}
						>
							{userClassification === '청인'
								? '영상통화 시작하기'
								: '신고 접수 대기'}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

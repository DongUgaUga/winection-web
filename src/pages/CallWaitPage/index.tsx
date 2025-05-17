import { useParams } from 'react-router-dom';
import useBreakpoint from '../../utils/hooks/useBreakPoint';
import styles from './CallWaitPage.module.scss';
import EmergencyCallWait from './EmergencyCallWait';
import GeneralCallWait from './GeneralCallWait';

export default function CallWaitPage() {
	const param = useParams();
	const breakPoint = useBreakpoint();

	return (
		<div className={styles.container}>
			{breakPoint !== 'mobile' && (
				<div className={styles.motto}>
					<div>오늘도 우리는,</div>
					<div>
						<span className={styles.emphasize}>소통</span>
						<span className={styles.gradient}>을 위해 달려나갑니다.</span>
					</div>
				</div>
			)}
			<div className={styles['before-call']}>
				{param.calltype === 'general-call' ? (
					<GeneralCallWait />
				) : (
					<EmergencyCallWait />
				)}
			</div>
		</div>
	);
}

import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import { useNavigate } from 'react-router-dom';
import KeyboardIcon from 'src/assets/keyboard.svg';
import RecordIcon from 'src/assets/record.svg';
import useMakeRoomId from 'src/pages/CallWaitPage/hooks/useMakeRoomId';
import useBreakpoint from 'src/utils/hooks/useBreakPoint';
import styles from './TestUnityCallWait.module.scss';

export default function TestUnityCallWait() {
	const breakPoint = useBreakpoint();
	const navigate = useNavigate();
	const { mutateAsync: makeRoomId } = useMakeRoomId();

	const [code, setCode] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	const makeNewCall = async () => {
		const newCode = await makeRoomId();
		navigate(`/unity/${newCode.room_id}`);
	};

	const enterCallPage = () => {
		if (code.length !== 6) {
			setErrorMessage('6자리 코드를 입력해주세요.');
			return;
		}
		setErrorMessage('');
		navigate(`/unity/${code}`);
	};

	return (
		<div className={styles['enter-call-container']}>
			<div className={styles['enter-call-container__call']}>
				<button className={styles['new-call']} onClick={makeNewCall}>
					<RecordIcon />
					<div>새 통화</div>
				</button>
				{breakPoint === 'mobile' && (
					<div className={styles['enter-call-container__call--or']}>또는</div>
				)}
				<div className={styles.participate}>
					<div
						className={cn({
							[styles.participate__code]: true,
							[styles['participate__code--error']]:
								errorMessage === '6자리 코드를 입력해주세요.',
						})}
					>
						<KeyboardIcon />
						<input
							onChange={(e) => setCode(e.target.value)}
							value={code}
							placeholder="코드 입력"
							className={styles['participate__code--input']}
						/>
					</div>
					<button
						onClick={enterCallPage}
						className={cn({
							[styles.participate__button]: true,
							[styles['participate__button--activated']]: code.length === 6,
						})}
					>
						참가
					</button>
				</div>
			</div>
			{errorMessage && <div className={styles.error}>{errorMessage}</div>}
		</div>
	);
}

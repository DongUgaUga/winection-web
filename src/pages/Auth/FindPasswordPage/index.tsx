import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BlindIcon from 'src/assets/blind.svg';
import DeleteIcon from 'src/assets/delete.svg';
import EyeIcon from 'src/assets/eye.svg';
import useLogin from '../../Auth/SignupPage/hooks/useLogin';
import styles from './FindPasswordPage.module.scss';
import useChangePassword from './hooks/useChangePassword';
import useFindPassword from './hooks/useFindPassword';

const PASSWORDREG = /^(?=.*[A-Za-z])(?=.*\d)(?=.*\W).{8,}.+$/;

export default function FindPasswordPage() {
	const navigate = useNavigate();
	const { mutateAsync: findPassword, isError } = useFindPassword();
	const { mutateAsync: changePassword } = useChangePassword();

	const { mutate: login } = useLogin();

	const [id, setId] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [step, setStep] = useState(1);

	const [password, setPassword] = useState('');
	const [passwordCheck, setPasswordCheck] = useState('');
	const [isBlind, setIsBlind] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');

	const handleStep = async () => {
		if (step === 1) {
			await findPassword({
				username: id,
				phone_number: phoneNumber,
			});

			if (!id || !phoneNumber || isError) return;

			setStep((value) => value + 1);
		}

		if (step === 2) {
			if (!PASSWORDREG.test(password) || !PASSWORDREG.test(passwordCheck)) {
				setErrorMessage(
					'비밀번호는 영문, 특수문자, 숫자를 포함한 8자리 이상이어야 합니다.',
				);
				return;
			}
			if (password !== passwordCheck) {
				setErrorMessage('비밀번호가 일치하지 않습니다.');
				return;
			}

			setErrorMessage('');
			changePassword({
				username: id,
				new_password: password,
				confirm_password: passwordCheck,
			});
			setStep((value) => value + 1);
			return;
		}
	};

	const goHome = () => {
		login({
			username: id,
			password: password,
		});
		navigate('/');
	};

	return (
		<>
			{step === 1 && (
				<div className={styles.container}>
					<div className={styles.container__step}>
						비밀번호를 찾고자하는 아이디와 전화번호를 입력해주세요.
					</div>
					<div className={styles.form}>
						<div className={styles.form__input}>
							<input
								type="text"
								className={styles['form__input--text']}
								placeholder="아이디를 입력하세요."
								value={id}
								onChange={(e) => setId(e.target.value)}
							/>
							<button
								className={styles['form__input--delete']}
								onClick={() => setId('')}
								tabIndex={-1}
							>
								<DeleteIcon />
							</button>
						</div>
						<div className={styles.form__input}>
							<input
								type="tel"
								className={styles['form__input--text']}
								placeholder="전화번호를 입력하세요. (ex. 010-0000-0000)"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
							/>
							<button
								className={styles['form__input--delete']}
								onClick={() => setPhoneNumber('')}
								tabIndex={-1}
							>
								<DeleteIcon />
							</button>
						</div>
					</div>
					{errorMessage && (
						<div className={styles['error-message']}>{errorMessage}</div>
					)}
					<button className={styles.container__button} onClick={handleStep}>
						다음
					</button>
				</div>
			)}
			{step === 2 && (
				<div className={styles.container}>
					<div className={styles.container__step}>
						새로운 비밀번호를 입력해주세요.
					</div>
					<div className={styles.form}>
						<div className={styles.form__input}>
							<input
								type="password"
								className={styles['form__input--text']}
								placeholder="새로운 비밀번호를 입력해주세요."
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
							<button
								className={styles['form__input--delete']}
								onClick={() => setPassword('')}
								tabIndex={-1}
							>
								<DeleteIcon />
							</button>
						</div>
						<div className={styles.form__input}>
							<input
								type={isBlind ? 'password' : 'text'}
								className={styles['form__input--text']}
								placeholder="새로운 비밀번호를 한 번 더 입력해주세요."
								value={passwordCheck}
								onChange={(e) => setPasswordCheck(e.target.value)}
							/>
							<button
								className={styles['form__input--delete']}
								onClick={() => setIsBlind((value) => !value)}
							>
								{isBlind ? <BlindIcon /> : <EyeIcon />}
							</button>
							<button
								className={styles['form__input--delete']}
								onClick={() => setPasswordCheck('')}
								tabIndex={-1}
							>
								<DeleteIcon />
							</button>
						</div>
					</div>
					{errorMessage && (
						<div className={styles['error-message']}>{errorMessage}</div>
					)}
					<button className={styles.container__button} onClick={handleStep}>
						다음
					</button>
				</div>
			)}
			{step === 3 && (
				<div className={styles['final-step']}>
					<div className={styles['final-step__description']}>
						새로운 비밀번호 설정이 완료되었습니다.
					</div>
					<button className={styles['final-step__button']} onClick={goHome}>
						홈으로
					</button>
				</div>
			)}
		</>
	);
}

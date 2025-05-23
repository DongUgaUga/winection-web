import { useEffect, useRef, useState } from 'react';
import { cn } from '@bcsdlab/utils';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import AgencyIcon from 'src/assets/agency.svg';
import BlindIcon from 'src/assets/blind.svg';
import ChevronDownIcon from 'src/assets/chevron-down.svg';
import EyeIcon from 'src/assets/eye.svg';
import HomeIcon from 'src/assets/home.svg';
import LockIcon from 'src/assets/lock.svg';
import ManIcon from 'src/assets/man.svg';
import PhoneIcon from 'src/assets/phone.svg';
import UserIcon from 'src/assets/user-classification.svg';
import {
	EmergencyOrganization,
	SignupRequest,
	UserClassification,
} from '../../../api/auth/entity';
import useCheckNickname from './hooks/useCheckNickname';
import useGeocode from './hooks/useGeocode';
import useSignup from './hooks/useSignup';
import styles from './SignupPage.module.scss';

declare global {
	interface Window {
		daum: any;
		naver: any;
	}
}

export default function SignupPage() {
	const {
		register,
		setValue,
		handleSubmit,
		watch,
		formState: { errors, isSubmitted },
	} = useForm({ mode: 'onChange' });

	const { mutate: signup } = useSignup();

	const { mutate: checkNickname, isError: isNicknameError } =
		useCheckNickname();

	const onSubmit = async (data: any) => {
		let coords: { lat: number; lng: number } | undefined = undefined;

		if (userClassification === '응급기관') {
			coords = await useGeocode(data.address);
		}

		const submitData: SignupRequest = {
			username: data.id!,
			password: data.password!,
			confirm_password: data['password-check']!,
			nickname: nickname,
			phone_number: data['phone-number'],
			user_type: userClassification || '농인',
			emergency_type:
				userClassification === '응급기관' ? emergencyAgency! : undefined,
			address: data.address,
			organization_name: data.agency,
			...(coords && {
				latitude: coords.lat,
				longitude: coords.lng,
			}),
		};

		if (
			nickname !== watch('nickname') ||
			!userClassification ||
			isNicknameError
		) {
			if (!userClassification) setUserClassification('');
			return;
		}

		signup(submitData);
	};

	const passwordRef = useRef(null);
	passwordRef.current = watch('password');

	const [isPasswordBlind, setIsPasswordBlind] = useState(true);
	const [isPasswordCheckBlind, setIsPasswordCheckBlind] = useState(true);

	const [nickname, setNickname] = useState('');

	const [userClassification, setUserClassification] = useState<
		UserClassification | ''
	>('');
	const [emergencyAgency, setEmergencyAgency] =
		useState<EmergencyOrganization | null>(null);

	const [isOpen, setIsOpen] = useState(false);

	const handlePasswordShow = () => {
		if (isPasswordBlind) {
			setIsPasswordBlind(false);
		} else {
			setIsPasswordBlind(true);
		}
	};

	const handlePasswordCheckShow = () => {
		if (isPasswordCheckBlind) {
			setIsPasswordCheckBlind(false);
		} else {
			setIsPasswordCheckBlind(true);
		}
	};

	const handleCheckNickname = (nickname: string) => {
		if (!nickname) {
			toast('닉네임을 입력해주세요.', { type: 'warning' });
			return;
		}

		setNickname(nickname);
		checkNickname(nickname);
	};

	const triggerDropdown = () => {
		if (isOpen) {
			setIsOpen(false);
		} else {
			setIsOpen(true);
		}
	};

	const onSelectUserClassification = (classification: UserClassification) => {
		setUserClassification(classification);
		setEmergencyAgency(null);
		setIsOpen(false);
	};

	const onSelectEmergencyAgency = (agency: EmergencyOrganization) => {
		setUserClassification('응급기관');
		setEmergencyAgency(agency);
		setIsOpen(false);
	};

	const loadPostcodeScript = () => {
		const script = document.createElement('script');
		script.src =
			'//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
		script.async = true;
		document.body.appendChild(script);
	};

	const loadNaverScript = () => {
		const script = document.createElement('script');
		script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVERMAP_CLIENT_ID}&submodules=geocoder`;
		script.async = true;

		script.onload = () => {
			if (!window.naver) {
				console.log('error');
				return;
			}
			console.log('load 완');
		};
		document.body.appendChild(script);
	};

	const handleSearch = () => {
		new window.daum.Postcode({
			oncomplete: function (data: any) {
				let addr = '';

				if (data.userSelectedType === 'R') {
					addr = data.roadAddress;
				} else {
					addr = data.jibunAddress;
				}

				setValue('address', addr, { shouldValidate: true });
			},
		}).open();
	};

	useEffect(() => {
		loadPostcodeScript();
		loadNaverScript();
	}, []);

	return (
		<form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
			<div className={styles.container__auth}>
				<div
					className={cn({
						[styles.container__input]: true,
						[styles['container__input--error']]: !!errors.id,
					})}
				>
					<ManIcon />
					<input
						className={styles['container__input--field']}
						placeholder="아이디 (필수)"
						type="text"
						{...register('id', {
							required: '아이디를 입력해주세요.',
						})}
					/>
				</div>
				<div
					className={cn({
						[styles.container__input]: true,
						[styles['container__input--error']]: !!errors.password,
					})}
				>
					<LockIcon />
					<input
						className={styles['container__input--field']}
						placeholder="비밀번호 (필수)"
						type={isPasswordBlind ? 'password' : 'text'}
						{...register('password', {
							required: { value: true, message: '비밀번호를 입력해주세요.' },
							minLength: {
								value: 8,
								message: '비밀번호는 8자리 이상이어야 합니다.',
							},
							pattern: {
								value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*\W).+$/,
								message: '비밀번호는 영문, 특수문자, 숫자를 포함해야 합니다.',
							},
						})}
					/>
					<button
						type="button"
						className={styles['container--password-hide']}
						onClick={handlePasswordShow}
						tabIndex={-1}
					>
						{isPasswordBlind ? <BlindIcon /> : <EyeIcon />}
					</button>
				</div>
				<div
					className={cn({
						[styles.container__input]: true,
						[styles['container__input--error']]: !!errors['password-check'],
					})}
				>
					<LockIcon />
					<input
						className={styles['container__input--field']}
						placeholder="비밀번호 확인 (필수)"
						type={isPasswordCheckBlind ? 'password' : 'text'}
						{...register('password-check', {
							required: {
								value: true,
								message: '비밀번호 확인을 입력해주세요.',
							},
							validate: (value) =>
								value === passwordRef.current ||
								'비밀번호가 일치하지 않습니다.',
						})}
					/>
					<button
						type="button"
						className={styles['container--password-hide']}
						onClick={handlePasswordCheckShow}
						tabIndex={-1}
					>
						{isPasswordCheckBlind ? <BlindIcon /> : <EyeIcon />}
					</button>
				</div>
			</div>
			{(errors.id || errors.password || errors['password-check']) && (
				<div className={styles['error-container']}>
					{errors.id && (
						<div className={styles['error-message']}>
							{errors.id.message as string}
						</div>
					)}
					{errors.password && (
						<div className={styles['error-message']}>
							{errors.password.message as string}
						</div>
					)}
					{errors['password-check'] && (
						<div className={styles['error-message']}>
							{errors['password-check'].message as string}
						</div>
					)}
				</div>
			)}
			<div className={styles['input-container']}>
				<div
					className={cn({
						[styles['input-container__input']]: true,
						[styles['input-container__input--error']]: !!errors.nickname,
					})}
				>
					<ManIcon />
					<input
						className={styles['input-container__input--field']}
						placeholder="닉네임 (필수)"
						type="text"
						{...register('nickname', {
							required: { value: true, message: '닉네임을 입력해주세요.' },
						})}
					/>
				</div>
				<button
					type="button"
					className={styles['input-container--check']}
					onClick={() => handleCheckNickname(watch('nickname'))}
				>
					중복확인
				</button>
			</div>
			{(errors.nickname ||
				watch('nickname') ||
				watch('nickname', '') !== nickname) && (
				<div className={styles['error-container']}>
					{errors.nickname && (
						<div className={styles['error-message']}>
							{errors.nickname.message as string}
						</div>
					)}
					{watch('nickname') && watch('nickname') !== nickname && (
						<div className={styles['check-message']}>
							닉네임 중복확인을 해주세요.
						</div>
					)}
				</div>
			)}
			<div className={styles['input-container']}>
				<div
					className={cn({
						[styles['input-container__input']]: true,
						[styles['input-container__input--error']]: !!errors.nickname,
					})}
				>
					<PhoneIcon />
					<input
						className={styles['input-container__input--field']}
						placeholder="전화번호 (ex. 010-0000-0000) (필수) "
						type="tel"
						{...register('phone-number', {
							required: { value: true, message: '전화번호를 입력해주세요.' },
							pattern: {
								value: /^01[016789]-\d{4}-\d{4}$/,
								message: '전화번호 형식에 맞게 입력해주세요',
							},
						})}
					/>
				</div>
			</div>
			{errors['phone-number'] && (
				<div className={styles['error-container']}>
					<div className={styles['error-message']}>
						{errors['phone-number'].message as string}
					</div>
				</div>
			)}
			<div
				className={cn({
					[styles.container__classification]: true,
					[styles['container__classification--open']]: isOpen,
				})}
			>
				<div className={styles['container__classification--title']}>
					<UserIcon />
					사용자 구분 (필수)
				</div>
				<div
					className={cn({
						[styles['button-container']]: true,
						[styles['button-container--error']]: userClassification === '',
						[styles['button-container--open']]: isOpen,
					})}
				>
					<button
						type="button"
						className={cn({
							[styles['button-container__button']]: true,
							[styles['button-container__button--selected']]:
								userClassification === '농인',
						})}
						onClick={() => onSelectUserClassification('농인')}
					>
						<div>농인</div>
					</button>
					<button
						type="button"
						className={cn({
							[styles['button-container__button']]: true,
							[styles['button-container__button--selected']]:
								userClassification === '청인',
						})}
						onClick={() => onSelectUserClassification('청인')}
					>
						<div>청인</div>
					</button>
					<button
						type="button"
						className={cn({
							[styles['button-container__button']]: true,
							[styles['button-container__emergency']]: true,
							[styles['button-container__emergency--selected']]:
								!!emergencyAgency,
							[styles['button-container__emergency--open']]: isOpen,
						})}
						onClick={() => {
							triggerDropdown();
						}}
					>
						<div>{emergencyAgency || '응급기관'}</div>
						<ChevronDownIcon />
					</button>
					{isOpen && (
						<ul className={styles['emergency-agency']}>
							<button
								className={styles['emergency-agency__item']}
								onClick={() => onSelectEmergencyAgency('병원')}
							>
								병원
							</button>
							<button
								className={styles['emergency-agency__item']}
								onClick={() => onSelectEmergencyAgency('경찰서')}
							>
								경찰서
							</button>
							<button
								className={styles['emergency-agency__item']}
								onClick={() => onSelectEmergencyAgency('소방서')}
							>
								소방서
							</button>
						</ul>
					)}
				</div>
				{userClassification === '' && isSubmitted && (
					<div className={styles['error-message']}>
						사용자 구분을 선택해주세요.
					</div>
				)}
				{emergencyAgency && (
					<div className={styles['emergency-agency-info']}>
						<div className={styles['input-container']}>
							<div
								className={cn({
									[styles['input-container__input']]: true,
									[styles['input-container__input--error']]: !!errors.address,
								})}
							>
								<HomeIcon />
								<input
									className={styles['input-container__input--field']}
									placeholder="주소"
									{...register('address', {
										required: { value: true, message: '주소를 입력해주세요.' },
									})}
								/>
							</div>
							<button
								type="button"
								className={styles['input-container--search']}
								onClick={handleSearch}
							>
								주소검색
							</button>
						</div>
						{errors.address && (
							<div className={styles['error-container']}>
								<div className={styles['error-message']}>
									{errors.address.message as string}
								</div>
							</div>
						)}
						<div className={styles['input-container']}>
							<div
								className={cn({
									[styles['input-container__input']]: true,
									[styles['input-container__input--error']]: !!errors.agency,
								})}
							>
								<AgencyIcon />
								<input
									className={styles['input-container__input--field']}
									placeholder="기관명"
									{...register('agency', {
										required: {
											value: true,
											message: '기관명을 입력해주세요.',
										},
									})}
								/>
							</div>
						</div>
						{errors.agency && (
							<div className={styles['error-container']}>
								<div className={styles['error-message']}>
									{errors.agency.message as string}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<button type="submit" className={styles['container--submit']}>
				가입
			</button>
		</form>
	);
}

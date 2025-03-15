import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ManIcon from 'src/assets/man.svg';
import LockIcon from 'src/assets/lock.svg'
import UserIcon from 'src/assets/user-classification.svg';
import ShevronDownIcon from 'src/assets/shevron-down.svg';
import HomeIcon from 'src/assets/home.svg';
import AgencyIcon from 'src/assets/agency.svg';
import BlindIcon from 'src/assets/blind.svg';
import EyeIcon from 'src/assets/eye.svg';
import { cn } from '@bcsdlab/utils';
import { useNavigate } from 'react-router-dom';
import styles from './SignupPage.module.scss';

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ mode: 'onChange' });

  const navigate = useNavigate();

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      nickname: nickname,
      userClassification: userClassification,
      emergencyAgency: userClassification === '응급기관' ? emergencyAgency : undefined,
    }
    
    if(nickname !== watch('nickname') || !userClassification || isDuplicatedNickname) {
      if(!userClassification) setUserClassification('');
      return;
    }

    sessionStorage.setItem('userInfo', JSON.stringify(submitData)); // 로그인 판단 여부
    navigate('/');
    return;
  };
  
  const passwordRef = useRef(null);
  passwordRef.current = watch("password");

  const [isPasswordBlind, setIsPasswordBlind] = useState(true);
  const [isPasswordCheckBlind, setIsPasswordCheckBlind] = useState(true);
  
  const [nickname, setNickname] = useState('');
  const [isDuplicatedNickname, setIsDuplicateedNickname] = useState(false);
  
  const [userClassification, setUserClassification] = useState<string | null>(null);
  const [emergencyAgency, setEmergencyAgency] = useState('');

  const [isOpen, setIsOpen] = useState(false);

  const handlePasswordShow = () => {
    if (isPasswordBlind) {
      setIsPasswordBlind(false);
    } else {
      setIsPasswordBlind(true);
    }
  }

  const handlePasswordCheckShow = () => {
    if (isPasswordCheckBlind) {
      setIsPasswordCheckBlind(false);
    } else {
      setIsPasswordCheckBlind(true);
    }
  }

  const checkDuplication = () => {
    const enteredNickname = watch('nickname');
    setNickname(enteredNickname);
    if (enteredNickname === '승주') {
      setIsDuplicateedNickname(true);
    } else {
      setIsDuplicateedNickname(false);
    }
  }

  const triggerDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  };

  const onSelectUserClassification = (classification: string) => {
    setUserClassification(classification);
    setEmergencyAgency('');
    setIsOpen(false);
  }

  const onSelectEmergencyAgency = (agency: string) => {
    setUserClassification('응급기관');
    setEmergencyAgency(agency);
    setIsOpen(false);
  }

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
            {...register("id", {
              required: '아이디를 입력해주세요.'
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
            {...register("password", {
              required: { value: true, message: '비밀번호를 입력해주세요.' },
              minLength: { value: 8, message: '비밀번호는 8자리 이상이어야 합니다.' },
              pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*\W).+$/, message: '비밀번호는 영문, 특수문자, 숫자를 포함해야 합니다.' },
            })}
          />
          <button
            type="button"
            className={styles['container--password-hide']}
            onClick={handlePasswordShow}
            tabIndex={-1}
          >
            { isPasswordBlind ? <BlindIcon /> : <EyeIcon /> }
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
            {...register("password-check", {
              required: { value: true, message: '비밀번호 확인을 입력해주세요.' },
              validate: (value) => value === passwordRef.current || "비밀번호가 일치하지 않습니다.",
            })}
          />
          <button
            type="button"
            className={styles['container--password-hide']}
            onClick={handlePasswordCheckShow}
            tabIndex={-1}
          >
            { isPasswordCheckBlind ? <BlindIcon /> : <EyeIcon /> }
          </button>
        </div>
      </div>
      {(errors.id || errors.password || errors['password-check']) &&
        <div className={styles['error-container']}>
          {errors.id && (<div className={styles['error-message']}>{errors.id.message as string}</div>)}
          {errors.password && (<div className={styles['error-message']}>{errors.password.message as string}</div>)}
          {errors['password-check'] && (<div className={styles['error-message']}>{errors['password-check'].message as string}</div>)}
        </div>
      }
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
            {...register("nickname", {
              required: { value: true, message: '닉네임을 입력해주세요.' },
            })}
          />
        </div>
        <button
          type="button"
          className={styles['input-container--check']}
          onClick={checkDuplication}
        >
          중복확인
        </button>
      </div>
      {(errors.nickname || watch('nickname') || watch('nickname') !== nickname ) &&
        <div className={styles['error-container']}>
          {errors.nickname && (<div className={styles['error-message']}>{errors.nickname.message as string}</div>)}
          { watch('nickname') && (
            watch('nickname') !== nickname 
            ? <div className={styles['check-message']}>닉네임 중복확인을 해주세요.</div>
            : <div className={cn({
                [styles['error-message']]: isDuplicatedNickname,
                [styles['ok-message']]: !isDuplicatedNickname,
              })}>
                { isDuplicatedNickname ? '이미 존재하는 닉네임입니다.' : '사용가능한 닉네임입니다.'}
              </div>
          )}
        </div>
      }
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
              [styles['button-container__button--selected']]: userClassification === '농인',
            })}
            onClick={() => onSelectUserClassification('농인')}
          >
            <div>농인</div>
          </button>
          <button
            type="button"
            className={cn({
              [styles['button-container__button']]: true,
              [styles['button-container__button--selected']]: userClassification === '일반인',
            })}
            onClick={() => onSelectUserClassification('일반인')}
          >
            <div>일반인</div>
          </button>
          <button
            type="button"
            className={cn({
              [styles['button-container__button']]: true,
              [styles['button-container__emergency']]: true,
              [styles['button-container__emergency--selected']]: !!emergencyAgency,
              [styles['button-container__emergency--open']]: isOpen,
            })}
            onClick={() => {
              triggerDropdown();
            }}
          >
            <div>{emergencyAgency || '응급기관'}</div>
            <ShevronDownIcon />
          </button>
          {isOpen && (
            <ul className={styles['emergency-agency']}>
              <div className={styles['emergency-agency__item']} onClick={() => onSelectEmergencyAgency('병원')}>병원</div>
              <div className={styles['emergency-agency__item']} onClick={() => onSelectEmergencyAgency('경찰서')}>경찰서</div>
              <div className={styles['emergency-agency__item']} onClick={() => onSelectEmergencyAgency('소방서')}>소방서</div>
            </ul>
          )}
        </div>
        {userClassification === '' &&
          <div className={styles['error-message']}>사용자 구분을 선택해주세요.</div>
        }
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
                  {...register("address", {
                    required: { value: true, message: '주소를 입력해주세요.' },
                  })}
                />
              </div>
            </div>
            {errors.address && 
              <div className={styles['error-container']}>
                <div className={styles['error-message']}>{errors.address.message as string}</div>
              </div>
            }
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
                  {...register("agency", {
                    required: { value: true, message: '기관명을 입력해주세요.' },
                  })}
                />
              </div>
            </div>
            {errors.agency &&
              <div className={styles['error-container']}>
                <div className={styles['error-message']}>{errors.agency.message as string}</div>
              </div>
            }
          </div>
        )}
      </div>
      <button type="submit" className={styles['container--submit']}>가입</button>
    </form>
  )
}

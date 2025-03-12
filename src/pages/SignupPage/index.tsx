import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import ManIcon from 'src/assets/man.svg';
import LockIcon from 'src/assets/lock.svg'
import UserIcon from 'src/assets/user-classification.svg';
import ShevronDownIcon from 'src/assets/shevron-down.svg';
import { cn } from '@bcsdlab/utils';
import styles from './SignupPage.module.scss';


export default function SignupPage() {
  // const formData = new FormData(event.target);
  // const data = Object.fromEntries(formData.entries());
  // console.log(data);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors } } = useForm({ mode: 'onChange' });
  const onSubmit = (data: any) => {
    console.log(data)
    return;
  };
  console.log(errors);
  const passwordCheckRef = useRef(null);
  passwordCheckRef.current = watch("password-check");

  const [userClassification, setUserClassification] = useState('');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.container}>
      <div className={styles.container__auth}>
        <div className={styles.container__input}>
          <ManIcon />
          <input
            className={styles['container__input--field']} 
            placeholder="아이디 (필수)"
            {...register("id", {
              required: '아이디를 입력해주세요.'
            })}
          />
        </div>
        <div className={styles.container__input}>
          <LockIcon />
          <input
            className={styles['container__input--field']}
            placeholder="비밀번호 (필수)"
            {...register("password", {
              required: { value: true, message: '비밀번호를 입력해주세요.' },
              minLength: { value: 8, message: '비밀번호는 8자리 이상이어야 합니다.' },
              pattern: { value: /^(?=.*[A-Za-z])(?=.*\d)(?=.*\W).+$/, message: '비밀번호는 영문, 특수문자, 숫자를 포함해야 합니다.' },
            })}
          />
        </div>
        <div className={styles.container__input}>
          <LockIcon />
          <input
            className={styles['container__input--field']}
            placeholder="비밀번호 확인"
            {...register("password-check", {
              required: { value: true, message: '비밀번호 확인을 입력해주세요.' },
              validate: (value) => value === passwordCheckRef.current || "비밀번호가 일치하지 않습니다.",
            })}
          />
        </div>
      </div>
      <div className={styles.container__auth}>
        <div className={styles.container__input} style={{ borderRadius: '16px' }}>
          <ManIcon />
          <input
            className={styles['container__input--field']}
            placeholder="닉네임 (필수)"
            {...register("nickname", {
              required: { value: true, message: '닉네임을 입력해주세요.' },
            })}
          />
        </div>
        <button>중복확인</button>
      </div>
      
      <div className={styles.container__classification}>
        <div className={styles['container__classification--title']}>
          <UserIcon />  
          사용자 구분
        </div>
        <div className={styles['button-container']}>
          <button
            className={cn({
              [styles['button-container__button']]: true,
              [styles['button-container__button--selected']]: userClassification === '농인',
            })}
            onClick={() => setUserClassification('농인')}
          >
            <div>농인</div>
          </button>
          <button
            className={cn({
              [styles['button-container__button']]: true,
              [styles['button-container__button--selected']]: userClassification === '일반인',
            })}
            onClick={() => setUserClassification('일반인')}
          >
            <div>일반인</div>
          </button>
          <button
            className={cn({
              [styles['button-container__button']]: true,
              [styles['button-container__button--selected']]: userClassification === '응급기관',
            })}
            onClick={() => setUserClassification('응급기관')}
          >
            <div>응급기관</div>
            <ShevronDownIcon />
          </button>
        </div>
      </div>
      <button type="submit" className={styles['container--submit']}>가입</button>
    </form>
  )
}
import RecordIcon from 'src/assets/record.svg';
import KeyboardIcon from 'src/assets/keyboard.svg';
import styles from './GeneralCallWait.module.scss';

export default function GeneralCallWait() {
  return (
    <div className={styles['enter-call-container']}>
      <div className={styles['enter-call-container__call']}>
        <button className={styles['new-call']}>
          <RecordIcon />
          <div>새 회의</div>
        </button>
        <div className={styles.participate}>
          <div className={styles.participate__code}>
            <KeyboardIcon />
            <input placeholder='코드 입력' className={styles['participate__code--input']} />
          </div>
          <button className={styles.participate__button}>참가</button>
        </div>
      </div>
      <div className={styles.checkbox}>
        <input type='checkbox' className={styles.checkbox__check} />
        <div className={styles.checkbox__agree}>참가하면 위치 정보 어쩌고에 동의</div>
      </div>
    </div> 
  )
}
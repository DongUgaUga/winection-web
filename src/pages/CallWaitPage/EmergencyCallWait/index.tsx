import CallIcon from 'src/assets/call.svg'
import ActiveCallIcon from 'src/assets/call-active.svg'
import GrandfaterAvatar from 'src/assets/grandfather-avatar.svg';
import { useState } from 'react';
import { cn } from '@bcsdlab/utils';
import styles from './EmergencyCallWait.module.scss';

const AGENCYS = ['병원', '경찰서', '소방서'];

export default function EmergencyCallWait() {
  const [agency, setAgency] = useState('');

  const selectAgency = (value: string) => {
    setAgency(value);
  }

  const connect = () => {
     
  }

  return (
    <div className={styles.container}>
      <div className={styles.help}>
        <div className={styles.help__description}>
          <div className={styles['help__description--main']}>도움이 필요한 기관을 선택해 주세요.</div>
          <div className={styles['help__description--sub']}>클릭 시, 가장 가까운 기관으로 연결됩니다.</div>
        </div>
        <div className={styles.agencys}>
          {AGENCYS.map((value) => (
            <div className={styles.agencys__agency}>
              <GrandfaterAvatar />
              <button
                className={cn({
                  [styles['agencys__agency--button']]: true,
                  [styles['agencys__agency--button--selected']]: value === agency,
                })}
                onClick={() => selectAgency(value)}
              >
                {value}
              </button>
          </div>
          ))}
        </div>
      </div>
      <div className={cn({
        [styles.connect]: true,
        [styles['connect--able']]: !!agency,
      })}>
        {agency ? <ActiveCallIcon /> : <CallIcon /> }
        <button
          className={cn({
            [styles.connect__button]: true,
            [styles['connect__button--able']]: !!agency,
          })}
          disabled={!agency}
          onClick={connect}
        >
          연결하기
        </button>
      </div>
    </div>
  )
}
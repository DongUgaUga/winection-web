import AlertIcon from 'src/assets/alert.svg';
import styles from './ReporterPosition.module.scss';

export default function ReporterPositionModal({
  setIsModalOpen
}: {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.container__title}>
          <AlertIcon />
          신고자 현재 위치
        </h1>
        <div className={styles.container__map}>
          지도
        </div>
        <button
          className={styles.container__button}
          onClick={() => setIsModalOpen(false)}
        >
          닫기
        </button>
      </div>
    </div>
  )
}

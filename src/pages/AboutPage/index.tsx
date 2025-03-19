import styles from './AboutPage.module.scss';

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>We-connection</h1>
      <p className={styles.description}>
        <strong>Winection</strong>은 응급 상황에서 신속한 대응을 위해 긴급 통화 중 사용자의 위치 정보를 GPS를 통해 공유합니다.
        이를 통해 보다 정확하고 빠른 지원이 이루어질 수 있도록 돕습니다.
      </p>

      <div className={styles.features}>
        <div className={styles.featureItem}>
          <h2>📍 실시간 위치 공유</h2>
          <p>긴급 통화 중 사용자의 현재 위치를 자동으로 공유하여 구조 요청을 보다 신속하게 처리할 수 있도록 합니다.</p>
        </div>
        <div className={styles.featureItem}>
          <h2>📞 직관적인 인터페이스</h2>
          <p>위급 상황에서도 쉽게 사용할 수 있도록 간결한 UI/UX를 제공합니다.</p>
        </div>
        <div className={styles.featureItem}>
          <h2>🛠 강력한 보안</h2>
          <p>사용자의 위치 정보는 철저하게 보호되며, 긴급 상황에서만 안전하게 공유됩니다.</p>
        </div>
      </div>

      <div className={styles.callToAction}>
        <p>더 많은 정보를 확인하고 싶다면 아래 버튼을 눌러주세요.</p>
        <button className={styles.button} onClick={() => alert('자세한 정보 페이지로 이동합니다.')}>자세히 보기</button>
      </div>
    </div>
  );
};

// 이 페이지는 어차피 통합될 예정 아니면 병렬 렌더링? 해서 그대로 사용할 수도

import { useState } from 'react';

const TranslatePage = () => {
  const [inputWords, setInputWords] = useState('');
  const [translatedText, setTranslatedText] = useState('번역된 문장:');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  const translateText = async () => {
    const words = inputWords.split(',').map(word => word.trim());

    if (words.length === 0 || words[0] === '') {
      alert('단어를 입력하세요!');
      return;
    }

    try {
      const response = await fetch('http://218.150.182.161:8000/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words })
      });

      if (!response.ok) {
        alert('번역 요청 실패!');
        return;
      }

      const data = await response.json();
      setTranslatedText(`번역된 문장: ${data.translated_sentence}`);

      // Base64 오디오 데이터 디코딩 및 재생
      const audioBase64 = data.audio_base64;
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))],
        { type: 'audio/mp3' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(audioUrl);
    } catch (error) {
      console.error('Error:', error);
      alert('번역 중 오류 발생!');
    }
  };

  return (
    <div style={{ textAlign: 'center', margin: '50px' }}>
      <h2>STSL Translation Test</h2>
      <input
        type="text"
        value={inputWords}
        onChange={(e) => setInputWords(e.target.value)}
        placeholder="단어 입력 (쉼표로 구분)"
        style={{ fontSize: '16px', margin: '10px' }}
      />
      <button onClick={translateText} style={{ fontSize: '16px', margin: '10px' }}>
        번역 및 음성 출력
      </button>

      <p style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px' }}>
        {translatedText}
      </p>
      
      {audioSrc && (
        <audio controls src={audioSrc} autoPlay />
      )}
    </div>
  );
};

export default TranslatePage;

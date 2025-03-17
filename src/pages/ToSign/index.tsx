import { useEffect, useState } from 'react';

const STTWebSocket = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<typeof SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const roomId = "test";
  const ws = new WebSocket(`wss://${import.meta.env.VITE_SERVER_URL}/stsl/${roomId}`);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. 크롬을 사용하세요.");
      return;
    }

    const recognitionInstance = new (window as any).webkitSpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "ko-KR";

    recognitionInstance.onstart = () => {
      setIsListening(true);
      console.log("음성 인식 시작됨");
    };

    recognitionInstance.onresult = (event: any) => {
      let newFinalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinalTranscript = event.results[i][0].transcript.trim();
        }
      }

      if (newFinalTranscript) {
        setTranscript(newFinalTranscript);
        ws.send(JSON.stringify({ type: "text", data: { text: newFinalTranscript } }));
        console.log("STT 변환 결과:", newFinalTranscript);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error("음성 인식 오류:", event.error);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      console.log("음성 인식 종료됨");
    };

    setRecognition(recognitionInstance);
  }, []);

  const startRecognition = () => {
    if (recognition) recognition.start();
  };

  const stopRecognition = () => {
    if (recognition) recognition.stop();
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', margin: '50px' }}>
      <h2>Google STT 실시간 음성 인식</h2>
      <button onClick={startRecognition} disabled={isListening} style={{ fontSize: '16px', margin: '10px', padding: '10px' }}>
        음성 인식 시작
      </button>
      <button onClick={stopRecognition} disabled={!isListening} style={{ fontSize: '16px', margin: '10px', padding: '10px' }}>
        음성 인식 중지
      </button>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>변환된 텍스트:</p>
      <p style={{ fontSize: '18px' }}>{transcript}</p>
    </div>
  );
};

export default STTWebSocket;
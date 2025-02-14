import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const VideoChatHandTracking = () => {
  const [roomId, setRoomId] = useState<string>("");
  const [peerStatus, setPeerStatus] = useState("클라이언트를 찾고 있습니다...");
  const [myHandInfo, setMyHandInfo] = useState("[]");
  const [peerHandInfo, setPeerHandInfo] = useState("");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const serverIP = "218.150.182.161";
  console.log(roomId);

  useEffect(() => {
    const promptRoomId = prompt("참여할 방 번호를 입력하세요 (예: room1)");
    if (promptRoomId) {
      setRoomId(promptRoomId);
      connectWebSocket(promptRoomId);
    }
  }, []);

  const connectWebSocket = (roomId: string) => {
    wsRef.current = new WebSocket(`ws://${serverIP}:8000/ws/${roomId}`);
    const ws = wsRef.current;

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.offer) {
          await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await peerConnectionRef.current?.createAnswer();
          await peerConnectionRef.current?.setLocalDescription(answer!);
          ws.send(JSON.stringify({ answer }));
        }
        if (data.answer) {
          await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        if (data.candidate) {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        if (data.hand_data) {
          if (data.client_id === "self") setMyHandInfo(JSON.stringify(data.hand_data));
          if (data.client_id === "peer") setPeerHandInfo("상대방 손 정보: " + JSON.stringify(data.hand_data));
        }
        if (data.client_id === "peer") {
          setPeerStatus("통신 중입니다.");
        }
      } catch (error) {
        console.error("WebSocket 메시지 처리 중 오류 발생:", error);
      }
    };

    ws.onopen = () => {
      console.log(`Connected to room ${roomId}`);
      startStreaming();
    };

    ws.onclose = () => {
      console.log("API 서버와 연결이 종료되었습니다.");
      setPeerStatus("클라이언트를 찾고 있습니다...");
    };

    ws.onerror = (error) => {
      console.error("WebSocket 오류 발생:", error);
    };
  };

  const startStreaming = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    hands.onResults((results) => {
      if (results.multiHandLandmarks && results.multiHandedness) {
        const handData = results.multiHandLandmarks.map((landmark, index) => ({
          hand_type: results.multiHandedness[index].label === "Right" ? "왼손" : "오른손",
          x: landmark[0].x.toFixed(2),
          y: landmark[0].y.toFixed(2),
          z: landmark[0].z.toFixed(2)
        }));
        wsRef.current?.send(JSON.stringify({ hand_data: handData }));
      }
    });

    const camera = new Camera(localVideoRef.current!, {
      onFrame: async () => {
        await hands.send({ image: localVideoRef.current! });
      },
      width: 640,
      height: 480
    });
    camera.start();
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <h1>1:1 화상채팅 및 손 인식</h1>
      <video ref={localVideoRef} autoPlay playsInline style={{ border: "2px solid green", width: "640px", height: "480px", transform: "scaleX(-1)" }}></video>
      <video ref={remoteVideoRef} autoPlay playsInline style={{ border: "2px solid red", width: "640px", height: "480px", transform: "scaleX(-1)" }}></video>
      <p>{peerStatus}</p>
      <p>내 손 정보: {myHandInfo}</p>
      <p>{peerHandInfo}</p>
    </div>
  );
};

export default VideoChatHandTracking;

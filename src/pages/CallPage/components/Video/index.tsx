import React, { useEffect, useRef, useState } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import styles from './Video.module.scss';
import { cn } from "@bcsdlab/utils";

interface Landmark {
  x: string;
  y: string;
  z: string;
}

interface FullBodyData {
  pose: Landmark[];
  left_hand: Landmark[];
  right_hand: Landmark[];
}

interface VideoProps {
  peerStatus: boolean;
  setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>;
  code: string;
  isCameraActive: boolean;
  isMicActive: boolean;
  callType: 'general' | 'emergency';
  callStartTime: string | null;
}

const userInfo = JSON.parse(sessionStorage.getItem('userInfo')!);

export default function Video(props: VideoProps) {
  const {
    peerStatus,
    setPeerStatus,
    code,
    isCameraActive,
    isMicActive,
    callType,
    callStartTime,
  } = props;
  const [myBodyInfo, setMyBodyInfo] = useState<string>("[]");
  const [peerBodyInfo, setPeerBodyInfo] = useState<string>("");
  useEffect(() => {
    console.log(myBodyInfo, peerBodyInfo);
    console.log('camera', isCameraActive, 'mic', isMicActive);
  } ,[]);
  const [isPeerCameraActive, setIsPeerCameraActive] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const holisticRef = useRef<Holistic | null>(null);

  useEffect(() => {
    if (!code) return;
  
    const ws = new WebSocket(`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}`);
    wsRef.current = ws;
  
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);

        // 📌 카메라 상태 메시지 처리
        if (data.type === 'camera_state' && data.client_id === 'peer') {
          console.log("상대방 카메라 상태 변경:", data.data.isCameraActive);
          setIsPeerCameraActive(data.data.isCameraActive);
        
          // 강제 재할당으로 멈춘 영상 리렌더링
          if (remoteVideoRef.current && peerConnectionRef.current) {
            const receiverStreams = peerConnectionRef.current.getReceivers()
              .map((r) => r.track)
              .filter(Boolean);
          
            const newStream = new MediaStream();
            receiverStreams.forEach(track => newStream.addTrack(track));
            remoteVideoRef.current.srcObject = newStream;
            remoteVideoRef.current.play();
          }
        }
  
        if (data.type === "offer") {
          await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
          const answer = await peerConnectionRef.current?.createAnswer();
          if (answer) {
            await peerConnectionRef.current?.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", data: answer }));
          }
          setPeerStatus(true);
        }
        if (data.type === "answer") {
          await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
          setPeerStatus(true);
        }
        if (data.type === "candidate") {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.data));
        }
        if (data.hand_data && data.client_id === "peer") {
          setPeerBodyInfo(`상대방 좌표 정보: ${JSON.stringify(data.hand_data)}`);
        }
        if (data.type === "leave") {
          console.log("상대방이 나갔습니다.");

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          peerConnectionRef.current?.close();
          peerConnectionRef.current = null;

          setPeerStatus(false);
        }
      } catch (error) {
          console.error("WebSocket 메시지 처리 중 오류 발생:", error);
      }
    };
  
    ws.onopen = () => {
      console.log(`Connected to room ${code}`);
      startStreaming();
    };
  
    ws.onclose = () => {
      console.log("WebSocket 연결 종료");
    };

    ws.onerror = (error) => {
      console.error("WebSocket 오류 발생:", error);
    };

    return () => {
      console.log("Video 컴포넌트 언마운트 - 정리 로직 실행");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.pause();
        remoteVideoRef.current.srcObject = null;
        remoteVideoRef.current.load();
      }

      if (localVideoRef.current) {
        localVideoRef.current.pause();
        localVideoRef.current.srcObject = null;
        localVideoRef.current.load();
      }

      wsRef.current?.close();
      wsRef.current = null;

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      setPeerStatus(false);
    }
  }, [code]);
  
  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      wsRef.current?.send(JSON.stringify({ type: "offer", data: offer }));

      peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
              wsRef.current?.send(JSON.stringify({ type: "candidate", data: event.candidate }));
          }
      };

      const holistic = new Holistic({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
      });

      const camera = new Camera(localVideoRef.current!, {
          onFrame: async () => {
              await holistic.send({ image: localVideoRef.current! });
          },
          width: 640,
          height: 480,
      });
      cameraRef.current = camera;
      camera.start();

      holistic.onResults((results) => {
          const handData: FullBodyData = {
              pose: results.poseLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || [],
              left_hand: results.leftHandLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || [],
              right_hand: results.rightHandLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || []
          };

          setMyBodyInfo(JSON.stringify(handData));
          wsRef.current?.send(JSON.stringify({ type: "hand_data", data: { hand_data: handData } }));
      });
    } catch (err) {
        console.error("웹캠 접근 에러:", err);
    }
  };

  useEffect(() => {
    const sendCameraState = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'camera_state',
          data: { isCameraActive }
        }));
      }
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
  
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // ✅ 새 비디오 트랙으로 기존 sender 교체
      const videoTrack = stream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
  
      // MediaPipe Camera 연결
      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });
  
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      holisticRef.current = holistic;
  
      const camera = new Camera(localVideoRef.current!, {
        onFrame: async () => {
          await holistic.send({ image: localVideoRef.current! });
        },
        width: 640,
        height: 480,
      });
  
      cameraRef.current = camera;
      camera.start();
    };
  
    const stopCamera = () => {
      console.log("🛑 카메라 stop() 호출");
  
      cameraRef.current?.stop();
      cameraRef.current = null;
  
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
  
      if (localVideoRef.current) {
        localVideoRef.current.pause();
        localVideoRef.current.srcObject = null;
        localVideoRef.current.load();
      }
    };
  
    if (isCameraActive) {
      setupCamera();
    } else {
      stopCamera();
    }

    sendCameraState();
  
    return () => {
      stopCamera(); // unmount 시에도 정리
    };
  }, [isCameraActive]);
  console.log(isPeerCameraActive);

  return (
    <div>
      <div className={styles['video-container']}>
        <div className={cn({
          [styles['video-wrapper']]: true,
          [styles['video-wrapper__main']]: true,
          [styles['video-wrapper__hidden']]: !peerStatus,
        })}>
          <video
            className={cn({
              [styles['video-container__main-video']]: true,
              [styles['video-container--hidden']]: !peerStatus,
            })}
            ref={remoteVideoRef}
            autoPlay
            playsInline
          />
          {peerStatus && !isPeerCameraActive && (
            <div className={styles['video-wrapper__overlay']}>
              <span>동동우동이</span>
            </div>
          )}
        </div>
        <div className={cn({
          [styles['video-wrapper']]: true,
          [styles['video-wrapper__sub']]: peerStatus,
          [styles['video-wrapper__main']]: !peerStatus,
        })}>
          <video
            className={cn({
              [styles['video-container__sub-video']]: peerStatus,
              [styles['video-container__main-video']]: !peerStatus,
            })}
            ref={localVideoRef}
            autoPlay
            playsInline
          />
          {!isCameraActive && (
            <div className={styles['video-wrapper__overlay']}>
              <span>{userInfo.nickname}</span>
            </div>
          )}
          {callType === 'general' && (
            <div className={cn({
              [styles.opponent]: true,
              [styles['opponent--flex']]: true,
              [styles['opponent--hidden']]: !peerStatus,
            })}>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>상대방 닉네임</div>
                  <div className={styles['opponent__content--text']}>동동우동이 <span>(농인)</span></div>
                </div>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>통화 시작 시간</div>
                  <div className={styles['opponent__content--text']}>{callStartTime}</div>
                </div>
            </div>
          )}
          {callType === 'emergency' && (
            <div className={cn({
              [styles.opponent]: true,
              [styles['opponent--grid']]: true,
              [styles['opponent--hidden']]: !peerStatus,
            })}>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>상대방 닉네임</div>
                  <div className={styles['opponent__content--text']}>동동우동이 <span>(농인)</span></div>
                </div>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>상대방 연락처</div>
                  <div className={styles['opponent__content--text']}>010-1234-5678</div>
                </div>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>통화 시작 시간</div>
                  <div className={styles['opponent__content--text']}>{callStartTime}</div>
                </div>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>특이사항</div>
                  <div className={styles['opponent__content--text']}>새롭게 시작해 볼래 너 그리고 나 사랑을 동경해 앞으로도 잘 부탁 해야 해야 해야 너를 봐야 봐야</div>
                </div>
                <div className={styles.opponent__content}>
                  <div className={styles['opponent__content--title']}>상대방 현재 위치</div>
                  <div className={styles['opponent__content--text']}>충청남도 아산시 모종로 21</div>
                </div>
            </div>
          )}
        </div>
      </div>
      {/*
        <p>내 좌표 정보: {myBodyInfo}</p>
        <p>{peerBodyInfo}</p>
      */}
    </div>
  );
}

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Holistic } from "@mediapipe/holistic";
import { Camera } from "@mediapipe/camera_utils";
import styles from './Video.module.scss';
import { cn } from "@bcsdlab/utils";

export interface VideoHandle {
  endCallCleanup: () => void;
}

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

const Video = forwardRef<VideoHandle, {
  peerStatus: boolean;
  setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>;
  code: string;
  isCameraActive: boolean;
  isMicActive: boolean;
  callType: 'general' | 'emergency';
  callStartTime: string | null;
}>(({
  peerStatus,
  setPeerStatus,
  code,
  isCameraActive,
  isMicActive,
  callType,
  callStartTime,
}, ref) => {
    const [myBodyInfo, setMyBodyInfo] = useState<string>("[]");
    const [peerBodyInfo, setPeerBodyInfo] = useState<string>("");
    useEffect(() => {
      console.log(myBodyInfo, peerBodyInfo);
      console.log('camera', isCameraActive, 'mic', isMicActive);
    } ,[]);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    useEffect(() => {
      const ws = new WebSocket(`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}`);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log(`Connected to room ${code}`);
        await setupLocalStream();
        await createConnectionAndOffer();
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("수신한 메시지", data);

        if (data.type === "offer") {
          console.log("[RTC] offer 수신 및 answer 준비 중");
          await setupLocalStream();
          await createConnectionAndAnswer(data.data);
        }

        if (data.type === "answer") {
          await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
        }

        if (data.type === "candidate") {
          await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.data));
        }

        if (data.type === "leave") {
          console.log("상대방이 나갔습니다.");
          cleanupRemote();
          setPeerStatus(false);
        }

        if (data.hand_data && data.client_id === "peer") {
          setPeerBodyInfo(`상대방 좌표 정보: ${JSON.stringify(data.hand_data)}`);
          setPeerStatus(true);
        }
      };

      window.addEventListener('beforeunload', () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "leave" }));
        }
      });

      return () => {
        ws.close();
      };
    }, [code]);

      // ws.onclose = (event) => {
      //   console.log("WebSocket 연결 종료");
      // 
      //   if (event.code === 1008) {
      //     alert("방 인원이 가득 찼습니다.")
      //   } else {
      //     setPeerStatus(false);
      //   }
      // };
      
      

    //useEffect(() => {
    //  if (localVideoRef.current && localVideoRef.current.srcObject == null) {
    //    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    //      localVideoRef.current!.srcObject = stream;
    //    }).catch(err => {
    //      console.error("다시 스트림 할당 실패:", err);
    //    });
    //  }
    //}, [peerStatus]);

    const setupLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;  
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
      });

      holistic.setOptions({
        smoothLandmarks: true,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      holistic.onResults((results) => {
        const handData: FullBodyData = {
          pose: results.poseLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || [],
          left_hand: results.leftHandLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || [],
          right_hand: results.rightHandLandmarks?.map((lm) => ({ x: lm.x.toFixed(2), y: lm.y.toFixed(2), z: lm.z.toFixed(2) })) || []
        };

        setMyBodyInfo(JSON.stringify(handData));
        wsRef.current?.send(JSON.stringify({ type: "hand_data", data: { hand_data: handData } }));
      });

      cameraRef.current = new Camera(localVideoRef.current!, {
        onFrame: async () => {
            await holistic.send({ image: localVideoRef.current! });
        },
        width: 950,
        height: 600,
      });
      cameraRef.current.start();
    };

    const createConnectionAndOffer = async () => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = peerConnection;

      addLocalTracks(peerConnection);
      setupOnTrack(peerConnection);
      setupOnIce(peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      wsRef.current?.send(JSON.stringify({ type: "offer", data: offer }));
    };

    const createConnectionAndAnswer = async (offer: RTCSessionDescriptionInit) => {
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = peerConnection;

      addLocalTracks(peerConnection);
      setupOnTrack(peerConnection);
      setupOnIce(peerConnection);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      wsRef.current?.send(JSON.stringify({ type: "answer", data: answer }));
    };

    const addLocalTracks = (pc: RTCPeerConnection) => {
      const stream = localStreamRef.current;
      if (!stream) return;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    const setupOnTrack = (pc: RTCPeerConnection) => {
      pc.ontrack = (event) => {
        console.log("ontrack 수신됨");
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }
    };

    const setupOnIce = (pc: RTCPeerConnection) => {
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsRef.current?.send(JSON.stringify({ type: "candidate", data: event.candidate }));
        }
      }
    };

    const cleanupRemote = () => {
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
      }
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };

    // 부모가 호출할 수 있도록 노출
    useImperativeHandle(ref, () => ({
      endCallCleanup: () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current?.send(JSON.stringify({ type: "leave" }));
          setTimeout(() => wsRef.current?.close(), 200);
        } 

        if (localVideoRef.current?.srcObject) {
          (localVideoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
          localVideoRef.current.srcObject = null;
        }

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
          localStreamRef.current = null;
        }

        cameraRef.current?.stop();
        cameraRef.current = null;
        
        cleanupRemote();
        setPeerStatus(false);
      }
    }));

    return (
        <div>
          {peerStatus
            ? (
              <div className={styles['video-container']}>
                <video className={styles['video-container__main-video']} ref={remoteVideoRef} autoPlay playsInline></video>
                <div>
                  <video className={styles['video-container__sub-video']} ref={localVideoRef} autoPlay playsInline></video>
                  {callType === 'general' && (
                    <div className={cn({
                      [styles.opponent]: true,
                      [styles['opponent--flex']]: true,
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
            ) : (
              <div>
                <video className={styles['video-container__main-video']} ref={localVideoRef} autoPlay playsInline></video>
              </div>
            )
          }
          {/*
            <p>내 좌표 정보: {myBodyInfo}</p>
            <p>{peerBodyInfo}</p>
          */}
        </div>
    );
});

export default Video;

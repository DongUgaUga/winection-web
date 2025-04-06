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
  peerStatus: boolean,
  setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>,
  code: string,
  isCameraActive: boolean,
  isMicActive: boolean,
  callType: 'general' | 'emergency',
  callStartTime: string | null,
}>(function Video({
  peerStatus,
  setPeerStatus,
  code,
  isCameraActive,
  isMicActive,
  callType,
  callStartTime,
}, ref) {
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

    useEffect(() => {
        if (!code) return;

        const ws = new WebSocket(`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}`);
        wsRef.current = ws;

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("수신한 메시지", data);

                if (data.type === "offer") {
                    await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
                    const answer = await peerConnectionRef.current?.createAnswer();
                    if (answer) {
                        await peerConnectionRef.current?.setLocalDescription(answer);
                        ws.send(JSON.stringify({ type: "answer", data: answer }));
                    }
                    startStreaming();
                }
                if (data.type === "answer") {
                    await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
                }
                if (data.type === "candidate") {
                    await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.data));
                }
                if (data.type === "leave") {
                  console.log("상대방이 나갔습니다.");
                  cleanupRemoteStream();
                  setPeerStatus(false);
                }

                if (data.hand_data && data.client_id === "peer") {
                    setPeerBodyInfo(`상대방 좌표 정보: ${JSON.stringify(data.hand_data)}`);
                    setPeerStatus(true);
                }
            } catch (error) {
                console.error("WebSocket 메시지 처리 중 오류 발생:", error);
            }
        };

        ws.onopen = () => {
            console.log(`Connected to room ${code}`);
            startStreaming();
        };

        ws.onclose = (event) => {
            console.log("WebSocket 연결 종료");

            if (event.code === 1008) {
              alert("방 인원이 가득 찼습니다.")
            } else {
              setPeerStatus(false);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket 오류 발생:", error);
        };
    }, [code]);

    useEffect(() => {
      if (peerStatus && peerConnectionRef.current) {
        const remoteStream = new MediaStream();
        peerConnectionRef.current.getReceivers().forEach((receiver) => {
          if (receiver.track.kind === 'video' || receiver.track.kind === 'audio') {
            remoteStream.addTrack(receiver.track);
          }
        });
    
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }

      if (localVideoRef.current && localVideoRef.current.srcObject == null) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
          localVideoRef.current!.srcObject = stream;
        }).catch(err => {
          console.error("다시 스트림 할당 실패:", err);
        });
      }
    }, [peerStatus]);

    const startStreaming = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerConnectionRef.current = peerConnection;

            peerConnection.ontrack = (event) => {
              if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = event.streams[0];
              }
            };

            stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

            peerConnection.onicecandidate = (event) => {
              if (event.candidate) {
                  wsRef.current?.send(JSON.stringify({ type: "candidate", data: event.candidate }));
              }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            wsRef.current?.send(JSON.stringify({ type: "offer", data: offer }));

            const holistic = new Holistic({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
            });

            holistic.setOptions({
                smoothLandmarks: true,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            const camera = new Camera(localVideoRef.current!, {
                onFrame: async () => {
                    await holistic.send({ image: localVideoRef.current! });
                },
                width: 950,
                height: 600,
            });
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

    const cleanupRemoteStream = () => {
      if (localVideoRef.current?.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        localVideoRef.current.srcObject = null;
      }
      
      if (remoteVideoRef.current?.srcObject) {
        const tracks = (remoteVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  
    // 부모가 호출할 수 있도록 노출
    useImperativeHandle(ref, () => ({
      endCallCleanup: () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current?.send(JSON.stringify({ type: "leave" }));
        } else {
          console.log("WebSocket 연결이 열려있지 않음");
        }
        setTimeout(() => {
          wsRef.current?.close();
        }, 200);
        cleanupRemoteStream();
      }
    }));

    useEffect(() => {
      const handleUnload = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "leave" }));
        }
      };
    
      window.addEventListener('beforeunload', handleUnload);
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
      };
    }, []);

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

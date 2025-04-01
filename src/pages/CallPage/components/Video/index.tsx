import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import styles from './Video.module.scss';
import { cn } from "@bcsdlab/utils";

export default function Video({
  peerStatus,
  setPeerStatus,
  code,
  isCameraActive,
  isMicActive,
  callType,
  callStartTime,
}: {
  peerStatus: boolean,
  setPeerStatus: React.Dispatch<React.SetStateAction<boolean>>,
  code: string,
  isCameraActive: boolean,
  isMicActive: boolean,
  callType: 'general' | 'emergency',
  callStartTime: string | null,
}) {
    const [myHandInfo, setMyHandInfo] = useState<string>("[]");
    const [peerHandInfo, setPeerHandInfo] = useState<string>("");
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const ws = new WebSocket(`wss://${import.meta.env.VITE_SERVER_URL}/ws/slts/${code}`);
    wsRef.current = ws;

    useEffect(() => {
        if (!code) return;

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "offer") {
                    await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
                    const answer = await peerConnectionRef.current?.createAnswer();
                    if (answer) {
                        await peerConnectionRef.current?.setLocalDescription(answer);
                        ws.send(JSON.stringify({ type: "answer", data: answer }));
                    }
                }
                if (data.type === "answer") {
                    await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(data.data));
                }
                if (data.type === "candidate") {
                    await peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(data.data));
                }
                if (data.hand_data) {
                    if (data.client_id === "peer") {
                        setPeerHandInfo(`상대방 손 정보: ${JSON.stringify(data.hand_data)}`);
                    }
                }
                if (data.client_id === "peer") {
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

        ws.onclose = () => {
            console.log("WebSocket 연결 종료");
            setPeerStatus(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket 오류 발생:", error);
        };
    }, [code]);

    const startStreaming = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;

            // 카메라, 마이크 상태 반영
            stream.getVideoTracks().forEach((track) => {
                track.enabled = !isCameraActive;
            });
            stream.getAudioTracks().forEach((track) => {
                track.enabled = !isMicActive;
            });

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

            const hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
            });

            hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            const camera = new Camera(localVideoRef.current!, {
                onFrame: async () => {
                    await hands.send({ image: localVideoRef.current! });
                },
                width: 950,
                height: 600,
            });
            camera.start();

            hands.onResults((results) => {
                if (results.multiHandLandmarks && results.multiHandedness) {
                    const handData = results.multiHandLandmarks.map((landmark, index) => ({
                        hand_type: results.multiHandedness[index].label === "Right" ? "왼손" : "오른손",
                        x: landmark[0].x.toFixed(2),
                        y: landmark[0].y.toFixed(2),
                        z: landmark[0].z.toFixed(2),
                    }));
                    setMyHandInfo(JSON.stringify(handData));
                    wsRef.current?.send(JSON.stringify({ type: "hand_data", data: { hand_data: handData } }));
                }
            });
        } catch (err) {
            console.error("웹캠 접근 에러:", err);
        }
    };

    useEffect(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !isCameraActive;
        });
      }, [isCameraActive]);
    
      useEffect(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !isMicActive;
        });
      }, [isMicActive]);
    console.log('camera', isCameraActive, 'mic', isMicActive);

    return (
        <div>
          {peerStatus
            ? (
              <div className={styles['video-container']}>
                <video className={styles['video-container__main-video']} ref={remoteVideoRef} autoPlay playsInline></video>
                <div>
                  <video className={styles['video-container__sub-video']} ref={localVideoRef} autoPlay playsInline muted></video>
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
                          <div className={styles['opponent__content--title']}>회의 시작 시간</div>
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
                          <div className={styles['opponent__content--title']}>회의 시작 시간</div>
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
                <video className={styles['video-container__main-video']} ref={localVideoRef} autoPlay playsInline muted></video>
              </div>
            )
          }
            <p>내 손 정보: {myHandInfo}</p>
            <p>{peerHandInfo}</p>
        </div>
    );
};

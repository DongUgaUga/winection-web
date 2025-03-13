import React, { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const VideoChatHandTracking: React.FC = () => {
    const [roomId, setRoomId] = useState<string>("");
    const [peerStatus, setPeerStatus] = useState<string>("클라이언트를 찾고 있습니다...");
    const [myHandInfo, setMyHandInfo] = useState<string>("[]");
    const [peerHandInfo, setPeerHandInfo] = useState<string>("");
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        const room = prompt("참여할 방 번호를 입력하세요 (예: room1)") || "defaultRoom";
        setRoomId(room);
    }, []);

    useEffect(() => {
        if (!roomId) return;

        const ws = new WebSocket(`ws://${import.meta.env.VITE_SERVER_URL}/ws/${roomId}`);
        wsRef.current = ws;

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
            console.log("WebSocket 연결 종료");
            setPeerStatus("클라이언트를 찾고 있습니다...");
        };

        ws.onerror = (error) => {
            console.error("WebSocket 오류 발생:", error);
        };
    }, [roomId]);

    const startStreaming = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
                width: 640,
                height: 480,
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

    return (
        <div>
            <h1>1:1 화상채팅 및 손 인식</h1>
            <video ref={localVideoRef} autoPlay playsInline style={{ border: "2px solid green", width: 640, height: 480, transform: "scaleX(-1)" }}></video>
            <video ref={remoteVideoRef} autoPlay playsInline style={{ border: "2px solid red", width: 640, height: 480, transform: "scaleX(-1)" }}></video>
            <p>{peerStatus}</p>
            <p>내 손 정보: {myHandInfo}</p>
            <p>{peerHandInfo}</p>
        </div>
    );
};

export default VideoChatHandTracking;

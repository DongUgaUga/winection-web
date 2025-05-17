import React, { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Hands } from "@mediapipe/hands";
import { useParams } from "react-router-dom";
import styles from "./TestUnityPage.module.scss";

const TestUnityPage = () => {
	const { roomId } = useParams();
	const unityCanvasRef = useRef<HTMLCanvasElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const [ws, setWs] = useState<WebSocket | null>(null);
	// const [roomId, setRoomId] = useState("test");

	useEffect(() => {
		// ✅ Unity 인스턴스 로드
		const script = document.createElement("script");
		script.src = "/unity-build/Build/unity-build.loader.js";
		script.onload = () => {
			setTimeout(() => {
				const canvas = document.querySelector("#unity-canvas");
				if (!canvas) {
					console.error("❌ unity-canvas를 찾을 수 없습니다.");
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-expect-error
				createUnityInstance(canvas, {
					dataUrl: "/unity-build/Build/unity-build.data",
					frameworkUrl: "/unity-build/Build/unity-build.framework.js",
					codeUrl: "/unity-build/Build/unity-build.wasm",
				})
					.then((unityInstance: any) => {
						console.log("✅ Unity 인스턴스 로드 완료", unityInstance);
						unityInstance.SendMessage("ReceiverObject", "SetRoomId", roomId);
					})
					.catch((err: any) => {
						console.error("❌ Unity 인스턴스 로드 실패", err);
					});
			}, 100);
		};
		document.body.appendChild(script);
	}, []);

	useEffect(() => {
		// ✅ WebSocket 연결
		const socket = new WebSocket(
			`wss://api.winection.kro.kr/ws/slts/${roomId}`,
		);
		setWs(socket);

		socket.onopen = () => {
			console.log("✅ WebSocket 연결 성공");
		};
		socket.onerror = (err) => console.error("❌ WebSocket 오류", err);
		socket.onclose = () => console.warn("🔌 WebSocket 연결 종료됨");

		return () => socket.close();
	}, [roomId]);

	useEffect(() => {
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			console.warn("🛑 WebSocket이 아직 열리지 않아서 손 추적 시작 안함");
			return;
		}

		// ✅ MediaPipe Hands 설정
		const hands = new Hands({
			locateFile: (file) =>
				`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
		});

		hands.setOptions({
			maxNumHands: 2,
			modelComplexity: 1,
			minDetectionConfidence: 0.5,
			minTrackingConfidence: 0.5,
		});

		hands.onResults((results) => {
			if (results.multiHandLandmarks && results.multiHandedness) {
				const handData = results.multiHandLandmarks.map((landmark, index) => ({
					hand_type:
						results.multiHandedness[index].label === "Right"
							? "왼손"
							: "오른손",
					x: landmark[0].x.toFixed(2),
					y: landmark[0].y.toFixed(2),
					z: landmark[0].z.toFixed(2),
				}));

				if (ws?.readyState === WebSocket.OPEN) {
					ws.send(
						JSON.stringify({
							type: "hand_data",
							data: { hand_data: handData },
						}),
					);
				}
			}
		});

		const initCamera = async () => {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}
			const camera = new Camera(videoRef.current!, {
				onFrame: async () => {
					await hands.send({ image: videoRef.current! });
				},
				width: 640,
				height: 480,
			});
			camera.start();
		};

		initCamera();
	}, [ws]);

	return (
		<div id="unity-container" className={styles["unity-container"]}>
			<h1 className={styles.header}>Unity - 실시간 손 제어 테스트</h1>
			<canvas
				id="unity-canvas"
				ref={unityCanvasRef}
				className={styles.show}
				tabIndex={-1}
			></canvas>
			<video
				ref={videoRef}
				autoPlay
				playsInline
				style={{ width: 1, height: 1, opacity: 0, position: "absolute" }}
			></video>
		</div>
	);
};

export default TestUnityPage;

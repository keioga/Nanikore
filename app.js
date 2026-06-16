// TensorFlow.js 本体と、1000種類を識別する MobileNet モデルをインポート
import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import * as mobilenet from 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.mjs';

const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
let model;

// 1. カメラの起動
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;
        return new Promise((resolve) => video.onloadedmetadata = () => resolve(video));
    } catch (e) {
        statusDiv.innerText = "カメラの起動に失敗: " + e.message;
    }
}

// 2. AIモデル（1000種類）の読み込み
async function initAI() {
    statusDiv.innerText = "カメラと1000種類識別AIを準備中...";
    await setupCamera();
    
    try {
        // Googleの1000種類識別モデルをロード
        model = await mobilenet.load({ version: 2, alpha: 1.0 });
        statusDiv.innerText = "準備完了！カメラに物を映してください。";
        predictLoop();
    } catch (e) {
        statusDiv.innerText = "AIの読み込みに失敗しました: " + e.message;
        console.error(e);
    }
}

// 3. 爆速仕分けの無限ループ
async function predictLoop() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // カメラの映像（現在の1コマ）から、上位3つの候補を爆速で推測
        // 枠の計算がないため、ここの処理スピードがMediaPipeより圧倒的に速いです
        const predictions = await model.classify(video, 3);
        
        if (predictions && predictions.length > 0) {
            // 最も確率が高い第1候補（[0]番目）の名前と確率（%）を取得
            const topResult = predictions[0];
            const name = topResult.className;
            const score = Math.round(topResult.probability * 100);
            
            // 画面のステータス表示をリアルタイムに書き換える
            statusDiv.innerHTML = `<span style="font-size: 1.8rem; font-weight: bold; color: #00df89;">${name}</span> (${score}%)`;
        }
    }
    // 画面の更新タイミング（1秒間に約60回）に合わせて次の判定を予約
    window.requestAnimationFrame(predictLoop);
}

// アプリの起動
initAI();
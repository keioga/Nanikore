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
    // ★ iPhoneの動画再生バグを回避するため、条件を「映像データが少しでもあれば動く」に変更
    if (video.readyState >= 2) {
        try {
            const predictions = await model.classify(video, 3);
            
            if (predictions && predictions.length > 0) {
                const topResult = predictions[0];
                const name = topResult.className;
                const score = Math.round(topResult.probability * 100);
                
                // 画面の文字をリアルタイムに書き換える
                statusDiv.innerHTML = `<span style="font-size: 1.8rem; font-weight: bold; color: #00df89;">${name}</span> (${score}%)`;
            }
        } catch (err) {
            // エラーが出てもループを止めない
            console.error(err);
        }
    }
    window.requestAnimationFrame(predictLoop);
}

window.addEventListener('load', initAI);
const video = document.getElementById('video');
const statusDiv = document.getElementById('status');
const searchBtn = document.getElementById('search-btn'); ///
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
                searchBtn.style.display = "block"; ///
            }
        } catch (err) {
            // エラーが出てもループを止めない
            console.error(err);
        }
    }
    window.requestAnimationFrame(predictLoop);
}

// ★ 4. 【大改造】ボタンが押されたら「現在の写真」をGoogle画像検索に送る
searchBtn.addEventListener('click', () => {
    // 画面に映っているカメラのサイズに合わせて、見えないキャンバス（写真の現像皿）を作る
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // キャンバスに今のカメラの1コマを「パシャッ」と複写（撮影）する
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 撮影した写真を「JPEG画像ファイル（Blobデータ）」に変換する
    canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Googleの画像検索にデータを送りつけるための「封筒（FormData）」を作る
        const formData = new FormData();
        formData.append('encoded_image', blob, 'screenshot.jpg');
        
        // Googleの画像検索アップロード窓口へ送信
        fetch('https://www.google.com/searchbyimage/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            // 送信が成功すると、Googleから「この検索結果のページを開いてね」というURLが返ってくる
            if (response.redirected) {
                // そのURLを新しいタブで開く！
                window.open(response.url, '_blank');
            } else {
                // 自動リダイレクトしないブラウザ対策（URLを直接読み取る）
                window.open(response.url, '_blank');
            }
        })
        .catch(err => {
            alert('画像検索の送信に失敗しました: ' + err.message);
        });
    }, 'image/jpeg', 0.8); // 画質80%のJPEGとして保存
});

window.addEventListener('load', initAI);
const urlstring =
    "https://westeurope.api.cognitive.microsoft.com/customvision/v3.0/Prediction/e5a38042-8d44-412e-ace3-6bc4e3c51bee/detect/iterations/Iteration19/image";
scan12.addEventListener("click", function () { startCam12(0); });
scan20.addEventListener("click", function () { startCam12(1); });
function startCam12(isHigh) {
    // Hide elements and show video
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.setAttribute("hidden", ""));
    let video = videoElement, scanning = scanningElement, version = "1.2";
    if (isHigh === 1) {
        video = document.getElementById("videoElement_high")
        scanning = scanninghigh;
        version = "2.0";
    }
    [video, Rescan2].forEach(el => el.removeAttribute("hidden"));
    const constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                video.srcObject = stream;
                tracks = stream.getTracks();
                scanning.removeAttribute("hidden");
                window.setTimeout(function () {
                    Capture2(video, version);
                }, 2000);
                Rescan2.addEventListener("click", function () {
                    scanning.removeAttribute("hidden");
                    Capture2(video, version);
                });
            })
            .catch(function (error) {
                console.log("無法取得視訊串流：", error);
                alert(
                    "您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！"
                );
            });
    } else {
        alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
    }
}
function Capture2(videoElement, version) {
    let canvas = document.createElement("canvas");
    [width, height] = videoDimensions(videoElement);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElement, 0, 0, width, height);
    canvas.toBlob((blob) => {
        if (blob) {
            ImageAnalyze2(blob);
        }
    })
    let Customaibase64 = canvas.toDataURL("image/png", 1).replace('data:image/png;base64,', '');
    let data = { imagestring: Customaibase64, width: width, height: height, version: version };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } };
    axios.post("/AiVision/Saveimage", data, config).then(function (response) { }).catch(err => { console.log(err); });
}
async function ImageAnalyze2(customimage) {
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let keyconfig = { headers: { 'requestverificationtoken': VerificationToken } }
    let prediction_key = "";
    let response = await axios.get("/AiVision/getkey", keyconfig);
    if (response.status !== 200) return;
    prediction_key = response.data.prediction_key;
    let config = {
        headers: {
            'Content-Type': 'application/octet-stream',
            'Prediction-Key': prediction_key
        }
    }
    axios.post(urlstring, customimage, config)
        .then(function (response) {
            if (response.status === 200) {
                scanningElement.setAttribute("hidden", "");
                if (document.getElementById("result_show")) {
                    document.getElementById("result_show").remove();
                }
                let predictions = response.data.predictions;
                resultHandling(predictions);
            }
        }).catch(err => { console.log(err); });
}
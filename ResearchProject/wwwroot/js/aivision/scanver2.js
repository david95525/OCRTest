const urlstring =
    "https://westeurope.api.cognitive.microsoft.com/customvision/v3.0/Prediction/e5a38042-8d44-412e-ace3-6bc4e3c51bee/detect/iterations/Iteration19/image";
scan12.addEventListener("click", function () { startCam12(0); });
scan20.addEventListener("click", function () { startCam12(1); });
function startCam12(isHigh) {
    // Hide elements and show video
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.setAttribute("hidden", ""));
    video = videoElement, scanning = scanningElement;
    let version = "1.2";
    if (isHigh === 1) {
        video = document.getElementById("videoElement_high")
        scanning = scanninghigh;
        version = "2.0";
    }
    [video, Rescan2, backelement].forEach(el => el.removeAttribute("hidden"));
    const constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                video.srcObject = stream;
                tracks = stream.getTracks();
                scanning.removeAttribute("hidden");
                window.setTimeout(function () {
                    Capture2(version);
                }, 1500);
                Rescan2.addEventListener("click", function () {
                    while (process.firstChild) { process.removeChild(process.firstChild); }
                    Capture2(version);
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
function Capture2(version) {
    processLog("scanning...");
    let canvas = screenCap(video);
    scanning.setAttribute("hidden", "");
    canvas.toBlob((blob) => { if (blob) { customaiExexute(blob); } });
    saveImage(canvas, version);
}
async function customaiExexute(customimage) {
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
    processLog("Executing...");
    loading.removeAttribute("hidden");
    axios.post(urlstring, customimage, config)
        .then(function (response) {
            if (response.status === 200) {
                scanning.setAttribute("hidden", "");
                if (document.getElementById("result_show")) {
                    document.getElementById("result_show").remove();
                }
                let predictions = response.data.predictions;
                dataProcessing(predictions);
            }
        }).catch(err => { console.log(err); });
}
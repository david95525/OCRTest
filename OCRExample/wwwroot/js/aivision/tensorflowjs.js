tensorflow1.addEventListener("click", function () { tensorflowCam(0); });
tensorflow2.addEventListener("click", function () { tensorflowCam(1); });
function tensorflowCam(isHigh) {
    // Hide elements and show video
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.setAttribute("hidden", ""));
    let video = videoElement;
    let scanning = scanningElement;
    if (isHigh === 1) {
        video = document.getElementById("videoElement_high")
        scanning = scanninghigh;
    }
    [video, Rescan2].forEach(el => el.removeAttribute("hidden"));
    //scan
    const constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                video.srcObject = stream;
                tracks = stream.getTracks();
                scanning.removeAttribute("hidden");
                window.setTimeout(function () {
                    tensorflow(video);
                }, 2000);
                Rescan2.addEventListener("click", function () {
                    scanning.removeAttribute("hidden");
                    tensorflow(video);
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
async function tensorflow(video) {
    let canvas = document.createElement("canvas");
    [width, height] = videoDimensions(video);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(video, 0, 0, width, height);
    let src = canvas.toDataURL("image/png");
    let customimage = document.createElement("img");
    customimage.src = src;
    tensorflowAnalyze(customimage);
    let Customaibase64 = canvas.toDataURL("image/png", 1).replace('data:image/png;base64,', '');
    let data = { imagestring: Customaibase64, width: width, height: height, version: "tensorflow1" };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } };
    axios.post("/AiVision/Saveimage", data, config).then(function (response) { }).catch(err => { console.log(err); });
}
async function tensorflowAnalyze(customimage) {
    let model = new cvstfjs.ObjectDetectionModel();
    await model.loadModelAsync('../aimodel/model.json');
    let result = await model.executeAsync(customimage);
    let detected_boxes, detected_scores, detected_classes;
    [detected_boxes, detected_scores, detected_classes] = result;
    if (document.getElementById("result_show")) {
        document.getElementById("result_show").remove();
    }
    let predictions = [];
    detected_boxes.map((box, i) => {
        if (detected_classes[i] <= 10) {
            let prdiction = {
                tagName: (detected_classes[i]).toString(),
                probability: detected_scores[i],
                boundingBox: { left: box[0], top: box[1] }
            };
            predictions.push(prdiction);
        }
    });
    resultHandling(predictions);
}
var model = {};
window.onload = async function () {
    model = new cvstfjs.ObjectDetectionModel();
    await model.loadModelAsync('../aimodel/model.json');
}
tensorflow1.addEventListener("click", function () { tensorflowCam(0); });
tensorflow2.addEventListener("click", function () { tensorflowCam(1); });
function tensorflowCam(isHigh) {
    // Hide elements and show video
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.setAttribute("hidden", ""));
    video = videoElement;
    scanning = scanningElement;
    if (isHigh === 1) {
        video = document.getElementById("videoElement_high")
        scanning = scanninghigh;
    }
    [video, Rescan, backelement].forEach(el => el.removeAttribute("hidden"));
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
                    processLog("scanning...");
                    tensorflow();
                }, 1500);
                Rescan.addEventListener("click", function () {
                    Rescan.setAttribute("disabled", "");
                    while (process.firstChild) {
                        process.removeChild(process.firstChild);
                    }
                    processLog("scanning...");
                    scanning.removeAttribute("hidden");
                    tensorflow();
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
function tensorflow() {
    start_time = performance.now();
    let canvas = screenCap(video);
    let customimage = document.createElement("img");
    customimage.src = canvas.toDataURL("image/png");
    customimage.width = canvas.width;
    customimage.height = canvas.height;
    scanning.setAttribute("hidden", "");
    modelExecute(customimage);
    saveImage(canvas, "tensorflow1");
}
async function modelExecute(customimage) {
    try {
        processLog("Model executing...");
        loading.removeAttribute("hidden");
        let load_start = performance.now();
        //await model.loadModelAsync('../aimodel/model.json');
        let load_end = performance.now();
        let result = await model.executeAsync(customimage);
        let model_end = performance.now();
        let load_time = `model載入：${(load_end - load_start).toFixed(3)} 毫秒`;
        let exe_time = `model執行：${(model_end - load_end).toFixed(3)} 毫秒`;
        processLog(load_time);
        processLog(exe_time);
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
        dataProcessing(predictions, 0.2);
        Rescan.removeAttribute("disabled");
    } catch (err) {
        console.log(err);
    }
}
var customscanElement = document.getElementById('custom_Scan');
var Rescan2Element = document.getElementById("Rescan2");
const urlstring =
    "https://westeurope.api.cognitive.microsoft.com/customvision/v3.0/Prediction/e5a38042-8d44-412e-ace3-6bc4e3c51bee/detect/iterations/Iteration19/image";
customscanElement.addEventListener("click", CustomstartCam);
document.getElementById('tensorflow').addEventListener("click", tensorflowCam);
function CustomstartCam() {
    scanElement.setAttribute("hidden", "");
    customscanElement.setAttribute("hidden", "");
    videoElement.removeAttribute("hidden");
    Rescan2Element.removeAttribute("hidden");
    //scan
    const constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                videoElement.srcObject = stream;
                tracks = stream.getTracks();
                scanningElement.removeAttribute("hidden");
                window.setTimeout(function () {
                    Capture_ver1_2(videoElement);
                }, 2000);
                Rescan2Element.addEventListener("click", function () {
                    Capture_ver1_2(videoElement);
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
function Capture_ver1_2(videoElement) {
    //截圖上傳
    let canvas = document.createElement("canvas");
    let [width, height] = videoDimensions(videoElement);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElement, 0, 0, width, height);
    canvas.toBlob((blob) => {
        if (blob) {
            CustomImageAnalyze(blob);
        }
    })
    let Customaibase64 = canvas.toDataURL("image/png", 1).replace('data:image/png;base64,', '');
    let data = { imagestring: Customaibase64 };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } };
    axios.post("/AiVision/Saveimage", data, config).then(function (response) { }).catch(err => { console.log(err); });
}
async function CustomImageAnalyze(customimage) {
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
function resultHandling(predictions) {
    let ylist = [0, 0, 0];
    let xGroups = [[], [], []];
    let numGroups = [[], [], []];
    let topcontent = "";
    predictions.forEach((prediction) => {
        //排除條件
        if (prediction.probability < 0.33 || isNaN(prediction.tagName)) return;
        for (let i = 0; i < ylist.length; i++) {
            //以第一個高度為基準
            if (ylist[i] === 0) {
                ylist[i] = Math.round(prediction.boundingBox.top * 100) / 100;
                numGroups[i].push(parseInt(prediction.tagName));
                xGroups[i][0] = prediction.boundingBox.left;
                topcontent = `${topcontent} (1)${prediction.tagName} y:${prediction.boundingBox.top} x:${prediction.boundingBox.left}`;
                return;
            }
            //第一個高度區間內視為同一列數字
            if (Math.abs(prediction.boundingBox.top - ylist[i]) < 0.04) {
                topcontent = `${topcontent} ${prediction.tagName} y:${prediction.boundingBox.top} x:${prediction.boundingBox.left}`;
                numberHandling(prediction.boundingBox.left, parseInt(prediction.tagName), i, xGroups, numGroups);
                return;
            }
        }
    });
    document.getElementById("topcontent").textContent = topcontent;
    if (numGroups[0].length > 0) {
        //先把num和top對應起來
        let combined = ylist.map((top, index) =>
            ({ top, number: isNaN(numGroups[index].join('')) ? 0 : parseInt(numGroups[index].join(''), 10) }));
        //照高度小到大重排
        combined.sort((a, b) => a.top - b.top);
        //分別給予sys dia pul 
        let [sys, dia, pul] = combined.map(item => item.number);
        let renders = [];
        let index = 0;
        let values = [sys, dia, pul];
        let ranges = [
            [40, 180], // sys 範圍
            [20, 140], // dia 範圍
            [20, 100]  // pul 範圍
        ];
        for (let i = 0; i < values.length; i++) {
            let value = values[i];
            let [min, max] = ranges[index];
            if (value >= min && value <= max) {
                renders.push({ value: value.toString(), x: 10, y: 25 + index * 40, x1: 0, x2: 0, y1: 0, y3: 0 });
                index++;
            }
        }
        renderPredictions(renders);
        let content = "";
        document.getElementById("content").textContent = content + " " + sys + " " + dia + " " + pul;
    }
}
function numberHandling(predictionLeft = 0, number = 0, order = 0, xGroups = [], numGroups = []) {
    if (order < 0 || order > 2) return;
    var xlist = xGroups[order];
    var numlist = numGroups[order];
    var max = predictionLeft;
    if (xlist.length === 1) {
        let point = Math.round(xlist[0] * 100) / 100;
        //是否和[0]數字重複
        if (Math.abs(predictionLeft - point) <= 0.05 && number === numlist[0])
            return;
        //新值比[0]大 插入array最前面
        if (max < xlist[0]) {
            xlist.push(xlist[0]);
            numlist.push(numlist[0]);
            xlist[0] = max;
            numlist[0] = number;
        }
        //新值比[0]小 array最後新增
        if (max > xlist[0]) {
            xlist.push(max);
            numlist.push(number);
        }
        return;
    }
    if (xlist.length === 2) {
        //是否和[0]數字重複
        let point0 = Math.round(xlist[0] * 100) / 100;
        if (Math.abs(predictionLeft - point0) < 0.05 && number === numlist[0])
            return;
        //是否和[1]數字重複
        let point1 = Math.round(xlist[1] * 100) / 100;
        if (Math.abs(predictionLeft - point1) < 0.05 && number === numlist[1])
            return;
        //新值比[0]大 插入array最前面
        if (max < xlist[0]) {
            xlist.push(xlist[1]);
            numlist.push(numlist[1]);
            xlist[1] = xlist[0];
            numlist[1] = numlist[0];
            xlist[0] = max;
            numlist[0] = number;
        }
        //新值比[0]小 比[1]大 插入[1]前面
        else if (max < xlist[1]) {
            xlist.push(xlist[1]);
            numlist.push(numlist[1]);
            xlist[1] = max;
            numlist[1] = number;
        }
        //新值比[0][1]小 array最後新增
        else if (max > xlist[1]) {
            xlist.push(max);
            numlist.push(number);
        }
    }
}
function tensorflowCam() {
    scanElement.setAttribute("hidden", "");
    customscanElement.setAttribute("hidden", "");
    videoElement.removeAttribute("hidden");
    //scan
    const constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(function (stream) {
                videoElement.srcObject = stream;
                tracks = stream.getTracks();
                scanningElement.removeAttribute("hidden");
                window.setTimeout(function () {
                    tensorflow(videoElement);
                }, 2000);
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
async function tensorflow(videoElement) {
    let canvas = document.createElement("canvas");
    let [width, height] = videoDimensions(videoElement);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElement, 0, 0, width, height);
    let src = canvas.toDataURL("image/png");
    let customimage = document.createElement("img");
    customimage.src = src;
    tensorflowAnalyze(customimage);
    let Customaibase64 = canvas.toDataURL("image/png", 1).replace('data:image/png;base64,', '');
    let data = { imagestring: Customaibase64 };
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
    console.log(result);
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
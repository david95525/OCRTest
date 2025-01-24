var videoElement = document.getElementById("videoElement");
var scanningElement = document.getElementById("scanning_view");
var scanninghigh = document.getElementById("scanning_view_high");
var scan11 = document.getElementById('Scan11');
var scan12 = document.getElementById('Scan12');
var scan20 = document.getElementById('Scan20');
var tensorflow1 = document.getElementById('tensorflow1');
var tensorflow2 = document.getElementById('tensorflow2');
var Rescan = document.getElementById("Rescan");
var Rescan2 = document.getElementById("Rescan2");
var loading = document.getElementById("loading");
var tracks;
var video = videoElement;
var scanning = scanningElement;
var width = 0, height = 0;
//debug info
var process = document.getElementById("process");
var backelement = document.getElementById("back");
var content = document.getElementById("content");
backelement.addEventListener("click", back);
function back() {
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.removeAttribute("hidden"));
    [Rescan, Rescan2, backelement].forEach(el => el.setAttribute("hidden", ""));
    content.textContent = "";
    tracks.forEach(track => track.stop());
    videoElement.setAttribute("hidden", "");
    document.getElementById("videoElement_high").setAttribute("hidden", "");
    if (document.getElementById("result_show")) {
        document.getElementById("result_show").remove();
    }
    while (process.firstChild) {
        process.removeChild(process.firstChild);
    }
}
function dataProcessing(predictions, probability = 0.33) {
    processLog("Data processing...");
    let ylist = [0, 0, 0];
    let xGroups = [[], [], []];
    let numGroups = [[0], [0], [0]];
    let topcontent = "";
    predictions.forEach((prediction) => {
        //排除條件
        if (prediction.probability < probability || isNaN(prediction.tagName)) return;
        for (let i = 0; i < ylist.length; i++) {
            //以第一個高度為基準
            if (ylist[i] === 0) {
                ylist[i] = Math.round(prediction.boundingBox.top * 100) / 100;
                numGroups[i][0] = parseInt(prediction.tagName);
                xGroups[i][0] = prediction.boundingBox.left;
                topcontent = `${topcontent} (1)${prediction.tagName} y:${prediction.boundingBox.top} x:${prediction.boundingBox.left}`;
                return;
            }
            //第一個高度區間內視為同一列數字
            if (Math.abs(prediction.boundingBox.top - ylist[i]) < 0.04) {
                topcontent = `${topcontent} ${prediction.tagName} y:${prediction.boundingBox.top} x:${prediction.boundingBox.left}`;
                if (i < 0 || i > 2) return;
                let xlist = xGroups[i];
                let numlist = numGroups[i];
                let max = prediction.boundingBox.left;
                let number = parseInt(prediction.tagName);
                if (xlist.length === 1) {
                    let point = Math.round(xlist[0] * 100) / 100;
                    //是否和[0]數字重複
                    if (Math.abs(prediction.boundingBox.left - point) <= 0.05 && number === numlist[0])
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
                    if (Math.abs(prediction.boundingBox.left - point0) < 0.05 && number === numlist[0])
                        return;
                    //是否和[1]數字重複
                    let point1 = Math.round(xlist[1] * 100) / 100;
                    if (Math.abs(prediction.boundingBox.left - point1) < 0.05 && number === numlist[1])
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
        }
    });
    document.getElementById("topcontent").textContent = topcontent;
    console.log(numGroups);
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
            [1, 180], // sys 範圍
            [1, 140], // dia 範圍
            [1, 100]  // pul 範圍
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
        content.textContent = " " + sys + " " + dia + " " + pul;
    } else {
        processLog("rendering fail");
    }
    loading.setAttribute("hidden", "");
}
function renderPredictions(predictions) {
    processLog("result rendering...");
    let canvas = document.createElement("canvas");
    canvas.id = "result_show";
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    predictions.forEach(({ value, x, y }) => {
        let boxWidth = 44, boxHeight = 26, textOffsetX = 1, textwidth = 10, textheight = 10;
        if (value.length === 1) textOffsetX = 10;
        if (value.length === 2) textOffsetX = 4;
        // Draw the rounded rectangle
        ctx.strokeStyle = "white";
        ctx.fillStyle = "#00B5EC";
        ctx.beginPath();
        ctx.roundRect(x, y, boxWidth, boxHeight, 15);
        ctx.stroke();
        ctx.fill();
        // Draw the text
        ctx.font = "20px sans-serif";
        ctx.textBaseline = "top";
        ctx.fillStyle = "white";
        ctx.fillText(value, (x + textwidth / 2) + textOffsetX, (y + textheight / 2) + 1);
    });
    document.body.append(canvas);
};
//common
function screenCap() {
    let canvas = document.createElement("canvas");
    [width, height] = videoDimensions(video);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(video, 0, 0, width, height);
    return canvas;
}
function videoDimensions(video) {
    let videoRatio = video.videoWidth / video.videoHeight;
    let width = video.offsetWidth, height = video.offsetHeight;
    let elementRatio = width / height;
    if (elementRatio > videoRatio) width = height * videoRatio;
    else height = width / videoRatio;
    return [width, height];
}
function processLog(text = "") {
    let divelement = document.createElement("div");
    divelement.textContent = text;
    process.appendChild(divelement);
}
function saveImage(canvas, version = "") {
    let Customaibase64 = canvas.toDataURL("image/png", 1).replace('data:image/png;base64,', '');
    let data = { imagestring: Customaibase64, width: canvas.width, height: canvas.height, version: version };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } };
    axios.post("/AiVision/saveImage", data, config)
        .then(function (response) { }).catch(err => { console.log(err); });
}
//date
let nowdate = moment(new Date()).format("YYYY/MM/DD");
document.getElementById('add_date_scan').value = nowdate;
document.getElementById('hour_scan').value = 10;
document.getElementById('minute_scan').value = 12;
document.getElementById("scan_save_button").addEventListener("click", returntoFlutter);
function returntoFlutter() {
    let sys = document.getElementById("sys").value;
    let dia = document.getElementById("dia").value;
    let pul = document.getElementById("pul").value;
    let data = { sys: sys, dia: dia, pul: pul };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } }
    axios.post("/AiVision/back", data, config)
        .then(function (response) {
            if (response.status === 200) {
                let result = response.data;
                location.href = result.redirect_uri;
            }
        }).catch(err => { console.log(err); });
}
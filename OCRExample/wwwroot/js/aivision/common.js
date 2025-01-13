var videoElement = document.getElementById("videoElement");
var scanningElement = document.getElementById("scanning_view");
var scanninghigh = document.getElementById("scanning_view_high");
var scan11 = document.getElementById('Scan11');
var scan12 = document.getElementById('Scan12');
var scan20 = document.getElementById('Scan20');
var tensorflow1 = document.getElementById('tensorflow1');
var tensorflow2 = document.getElementById('tensorflow2');
var Rescan2 = document.getElementById("Rescan2");
var width = 0, height = 0;
function videoDimensions(video) {
    let videoRatio = video.videoWidth / video.videoHeight;
    let width = video.offsetWidth, height = video.offsetHeight;
    let elementRatio = width / height;
    if (elementRatio > videoRatio) width = height * videoRatio;
    else height = width / videoRatio;
    return [width, height];
}
const renderPredictions = function (predictions) {
    let canvas = document.createElement("canvas");
    canvas.id = "result_show";
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    predictions.forEach(({ value, x, y }) => {
        //if (prediction.x1 != 0 && prediction.value != "0") {
        //    let width = prediction.x2 - prediction.x1;
        //    let height = prediction.y3 - prediction.y1;
        //    ctx.strokeStyle = "red";
        //    ctx.lineWidth = 4;
        //    ctx.strokeRect(
        //        prediction.x1,
        //        prediction.y1,
        //        width,
        //        height
        //    );
        //}
        let boxWidth = 44, boxHeight = 26, textOffsetX = 1, textwidth = 10, textheight = 10;
        if (value.length === 1) textOffsetX = 10;
        if (value.length === 2) textOffsetX = 4;
        // Draw background rectangle
        //ctx.fillStyle = "#00B5EC";
        //ctx.fillRect(x, y, boxWidth, boxHeight);
        // Draw rectangle border
        //ctx.strokeStyle = "white";
        //ctx.lineWidth = 1;
        //ctx.strokeRect(x, y, boxWidth, boxHeight);
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
//ver1.2 common methods
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
    scanningElement.setAttribute("hidden", "");
    scanninghigh.setAttribute("hidden", "");
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
        let content = "";
        document.getElementById("content").textContent = content + " " + sys + " " + dia + " " + pul;
    }
}
function numberHandling(predictionLeft = 0, number = 0, order = 0, xGroups = [], numGroups = []) {
    console.log(order);
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
    console.log(xlist);
}
//date
let nowdate = moment(new Date()).format("YYYY/MM/DD");
document.getElementById('add_date_scan').value = nowdate;
document.getElementById('hour_scan').value = 10;
document.getElementById('minute_scan').value = 12;
document.getElementById("scan_save_button").addEventListener("click", Back);
function Back() {
    let sys = document.getElementById("sys").value;
    let dia = document.getElementById("dia").value;
    let pul = document.getElementById("pul").value;
    let data = { sys: sys, dia: dia, pul: pul };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } }
    axios.post("/AiVision/Back", data, config)
        .then(function (response) {
            if (response.status === 200) {
                let result = response.data;
                location.href = result.redirect_uri;
            }
        }).catch(err => { console.log(err); });
}
var videoElement = document.getElementById("videoElement");
var scanElement = document.getElementById('Scan');
let scanningElement = document.getElementById("scanning_view");
var Rescan1Element = document.getElementById("Rescan1");
//input
var dateElement = document.getElementById('add_date_scan');
var hourElement = document.getElementById('hour_scan');
var minuteElement = document.getElementById('minute_scan');
var ap_modeElement = document.getElementById("ap_mode_scan");
var sysElement = document.getElementById('sys');
var diaElement = document.getElementById('dia');
var pulElement = document.getElementById('pul');
//date
let nowdate = moment(new Date()).format("YYYY/MM/DD");
dateElement.value = nowdate;
hourElement.value = 10;
minuteElement.value = 12;
function videoDimensions(video) {
    let videoRatio = video.videoWidth / video.videoHeight;
    let width = video.offsetWidth, height = video.offsetHeight;
    let elementRatio = width / height;
    if (elementRatio > videoRatio) width = height * videoRatio;
    else height = width / videoRatio;
    return [width, height];
}
document.getElementById("scan_save_button").addEventListener("click", Back);
scanElement.addEventListener("click", startCam);
function startCam() {
    // Hide elements and show video
    [scanElement, customscanElement].forEach(el => el.setAttribute("hidden", ""));
    [videoElement, Rescan1Element].forEach(el => el.removeAttribute("hidden"));

    let constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                videoElement.srcObject = stream;
                tracks = stream.getTracks();
                scanningElement.removeAttribute("hidden");
                setTimeout(() => Capture_ver1_1(videoElement), 2000);
                Rescan1Element.addEventListener("click", () => Capture_ver1_1(videoElement));
            })
            .catch(error => {
                console.error("無法取得視訊串流：", error);
                alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
            });
    } else {
        alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
    }
}
function Capture_ver1_1(videoElement) {
    let canvas = document.createElement("canvas");
    let [width, height] = videoDimensions(videoElement);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElement, 0, 0, width, height);
    let base64 = canvas.toDataURL("image/png", 1);
    ImageAnalyze(base64);
}
function ImageAnalyze(base64) {
    var base64String = base64.replace('data:image/png;base64,', '');
    let data = { imagestring: base64String };
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } }
    let toplist = [], numGroups = [], sys_dia_pul_y1 = [0, 0, 0];
    axios.post("/AiVision/ImageAnalyze", data, config)
        .then(({ status, data }) => {
            if (status !== 200) return;
            scanningElement.setAttribute("hidden", "");
            document.getElementById("result_show")?.remove();

            let predictions = data.predictions;
            let scancontent = "", ismicrolife = false;
            predictions.forEach(({ tagName, y1 }) => {
                if (tagName === "microlife") ismicrolife = true;
                if (tagName === "SYS") sys_dia_pul_y1[0] = y1;
                if (tagName === "DIA") sys_dia_pul_y1[1] = y1;
                if (tagName === "PUL") sys_dia_pul_y1[2] = y1;

                if (isNaN(tagName)) return;
                let number = parseInt(tagName);

                if (Math.abs(toplist[0] - y1) <= 10 && numGroups[0] === 1) number += 100;

                toplist.push(y1);
                numGroups.push(number);
                scancontent += ` number:${number} y1:${y1}`;
            });

            scancontent += ` ismicrolife:${ismicrolife}`;
            document.getElementById("content").textContent = scancontent;

            if (!ismicrolife) return;

            let [sys, dia, pul] = [numGroups[0] ?? 0, numGroups[1] ?? 0, numGroups[2] ?? 0];
            numGroups.forEach((num, i) => {
                if (Math.abs(toplist[i] - sys_dia_pul_y1[0]) <= 10) sys = num;
                if (Math.abs(toplist[i] - sys_dia_pul_y1[1]) <= 10) dia = (sys === num) ? 0 : num;
                if (Math.abs(toplist[i] - sys_dia_pul_y1[2]) <= 10) pul = (sys === num || dia === num) ? 0 : num;
            });
            sysElement.value = sys;
            diaElement.value = dia;
            pulElement.value = pul;
            let renders = numGroups.filter(num => num !== 0)
                .map((num, index) => ({ value: num.toString(), x: 10, y: 25 + index * 40, x1: 0, x2: 0, y1: 0, y3: 0 }));

            renderPredictions(renders);
        })
        .catch(console.log);
}
const renderPredictions = function (predictions) {
    let canvas = document.createElement("canvas");
    canvas.id = "result_show";
    let [width, height] = videoDimensions(videoElement);
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


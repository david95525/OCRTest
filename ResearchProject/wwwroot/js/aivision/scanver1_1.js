var Rescan11 = document.getElementById("Rescan11");
scan11.addEventListener("click", startCam11);
function startCam11() {
    // Hide elements and show video
    [scan11, scan12, scan20, tensorflow1, tensorflow2].forEach(el => el.setAttribute("hidden", ""));
    [videoElement, Rescan11].forEach(el => el.removeAttribute("hidden"));
    let constraints = { video: { facingMode: "environment" } };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => {
                videoElement.srcObject = stream;
                tracks = stream.getTracks();
                scanningElement.removeAttribute("hidden");
                setTimeout(() => Capture11(videoElement), 2000);
                Rescan11.addEventListener("click", () => Capture11(videoElement));
            })
            .catch(error => {
                console.error("無法取得視訊串流：", error);
                alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
            });
    } else {
        alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
    }
}
function Capture11(videoElement) {
    let canvas = document.createElement("canvas");
    [width, height] = videoDimensions(videoElement);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(videoElement, 0, 0, width, height);
    let base64 = canvas.toDataURL("image/png", 1);
    var base64String = base64.replace('data:image/png;base64,', '');
    let data = { imagestring: base64String, width: width, height: height };
    ImageAnalyze11(data);
}
function ImageAnalyze11(data) {
    let VerificationToken = document.getElementsByName("__RequestVerificationToken")[0].value;
    let config = { headers: { 'requestverificationtoken': VerificationToken } }
    let toplist = [], numGroups = [], sys_dia_pul_y1 = [0, 0, 0];
    axios.post("/AiVision/ImageAnalyze", data, config)
        .then(({ status, data }) => {
            if (status !== 200) return;
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
            document.getElementById('sys').value = sys;
            document.getElementById('dia').value = dia;
            document.getElementById('pul').value = pul;
            let renders = numGroups.filter(num => num !== 0)
                .map((num, index) => ({ value: num.toString(), x: 10, y: 25 + index * 40, x1: 0, x2: 0, y1: 0, y3: 0 }));

            renderPredictions(renders);
        })
        .catch(console.log);
}
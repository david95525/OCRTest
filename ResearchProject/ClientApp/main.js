import { createWorker } from 'tesseract.js';

var inputCanvas = document.getElementById('inputCanvas');
var outputCanvas = document.getElementById('outputCanvas');
var video = document.querySelector('video');
//event
var startscan = document.getElementById("startscan");
var stopscan = document.getElementById("stopscan");
var scanid = 0;
startscan.addEventListener("click", function () {
    console.log("start");
    screenshot();
    /*scanid = setInterval(screenshot, 5000);*/
});
stopscan.addEventListener("click", function () {
    clearInterval(scanid);
    console.log("stop");
    inputCanvas.getContext('2d').clearRect(0, 0, inputCanvas.width, inputCanvas.height);
});
//webRTC
var Constraints = {
    video: true
};
function handleSuccess(stream) {
    window.stream = stream; // 方便可以在瀏覽器console
    video.srcObject = stream;
}
function handleMediaStreamError(error) {
    console.log('navigator.getUserMedia error: ', error);
}
navigator.mediaDevices
    .getUserMedia(Constraints)
    .then(handleSuccess)
    .catch(handleMediaStreamError);
//canvas
function screenshot() {
    inputCanvas.width = 640;
    inputCanvas.height = 480;
    // 渲染
    inputCanvas.getContext('2d').drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height);
    tesserajs();
}
//Tessera.js
function tesserajs() {
    displayResult(90);
    let canvas_tessera = document.getElementById('outputCanvas');
    let src = canvas_tessera.getContext('2d').getImageData(0, 0, canvas_tessera.width, canvas_tessera.height)
    let dataURL = canvas_tessera.toDataURL('image/png');
    console.log(src); 
    (async () => {
        const worker = await createWorker({langPath: './lang-data'});
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(dataURL);
        if (text) {
            console.log(text);
        }
    })();
}
function displayResult(threshold) {
    let inputcanvas = document.getElementById('inputCanvas');
    let imageData = inputcanvas.getContext('2d').getImageData(0, 0, inputcanvas.width, inputcanvas.height);
    let data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Convert RGB values to grayscale (you can look that up)
        let grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
        // Check if the value is obove or below the threshold value and return white or black
        let finalColor = grayscale < threshold ? 0 : 255;
        // Asign the color
        data[i] = finalColor;
        data[i + 1] = finalColor;
        data[i + 2] = finalColor;
    }
    // Put the data into another canvas so we 
    outputCanvas.width = imageData.width;
    outputCanvas.height = imageData.height;
    outputCanvas.getContext('2d').putImageData(imageData, 0, 0);
}
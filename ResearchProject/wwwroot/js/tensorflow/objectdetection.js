var webcamElement = document.getElementById('webcam');
const canvas = document.getElementById('detect_result');
const context = canvas.getContext('2d');
const color = ["green", "yellow", "red"]
document.getElementById("start").addEventListener("click", app);
async function app() {
    var model = await cocoSsd.load();

    let showResult = async function () {
        let result = await model.detect(webcamElement);
        canvas.width = webcamElement.videoWidth;
        canvas.height = webcamElement.videoHeight;
        context.drawImage(webcamElement, 0, 0);
        context.font = '40px Arial';
        for (let i = 0; i < result.length; i++) {
            context.beginPath();
            //three dots mean spread over object get all its properties
            context.rect(...result[i].bbox);
            context.lineWidth = 5;
            context.strokeStyle = color[i % 3];
            context.fillStyle = color[i % 3];
            context.stroke();
            context.fillText(
                result[i].score.toFixed(3) + ' ' + result[i].class,
                result[i].bbox[0],
                result[i].bbox[1] - 5);
        }
        setTimeout(function () {
            showResult();
        }, 300);
    }

    setupWebcam().then(() => {
        showResult(model);
    }).catch(err => { console.log(err); });
}
function setupWebcam() {
    return new Promise((resolve, reject) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(stream => {
                    webcamElement.srcObject = stream;
                    webcamElement.addEventListener('loadeddata', () => resolve(),
                        false);
                })
                .catch(error => {
                    console.error("無法取得視訊串流：", error);
                    alert("您使用的瀏覽器不支援視訊串流，請使用其他瀏覽器，再重新開啟頁面！");
                    reject(error);
                });
        } else {
            reject("getUserMedia failed");
        }
    });
}

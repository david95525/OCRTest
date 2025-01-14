var cameraList = [];
var activeCamera = {};
var html5QrCode = {};
const config = { fps: 10, qrbox: { width: 250, height: 250 } };
document.addEventListener("DOMContentLoaded", function (event) {
    html5QrCode = new Html5Qrcode("reader");
    getCameras();
    document.getElementById("proscan").addEventListener("click", proScan);
    document.getElementById("easyscan").addEventListener("click", easyScan);
    document.getElementById("stopscan").addEventListener("click", stopScan);
})

const getCameras = () => {
    Html5Qrcode.getCameras()
        .then((devices) => {
            console.info(devices);
            if (devices && devices.length) {
                cameraList = devices;
                activeCamera = devices[0];
            }
        })
        .catch((err) => {
            console.error(err);
            cameraList = [];
        });
};
function onScanSuccess(decodedText, decodedResult) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    let content = document.getElementById("content");
    content.textContent = decodedText;
    stopScan();
}
const easyScan = () => {
    let html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
    html5QrcodeScanner.render(onScanSuccess);
}
const proScan = () => {

    html5QrCode
        .start(
            { facingMode: "user" },
            proScan,
            onScanSuccess
        )
        .then(() => {
        });
};
const stopScan = () => {
    try {
        html5QrCode
            .stop()
            .then((res) => {
                html5QrCode.clear();
            })
            .catch((err) => {
                console.log(err.message);
            });
    } catch (err) {
        console.log(err);
    }
}


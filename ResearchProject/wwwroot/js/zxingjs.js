document.getElementById("startButton").addEventListener("click", Openscan);
var scan_items = document.getElementById("scan_items");
function decodeOnce(codeReader, selectedDeviceId) {
    codeReader.decodeFromInputVideoDevice(selectedDeviceId, 'video').then((result) => {
        document.getElementById('add_device').value = result.text;
    }).catch((err) => {
        console.error(err);
    })
}
function Openscan() {
    let selectedDeviceId;

    const codeReader = new ZXing.BrowserQRCodeReader();
    console.log('ZXing code reader initialized');
    codeReader.getVideoInputDevices()
        .then((videoInputDevices) => {
            selectedDeviceId = videoInputDevices[0].deviceId;
            decodeOnce(codeReader, selectedDeviceId);
            document.getElementById('resetButton').addEventListener('click', () => {
                codeReader.reset();
                scan_items.classList.add("hidden");
                document.getElementById('add_device').value = '';
                console.log('Reset.')
            });
        }).then(() => { scan_items.classList.remove("hidden"); })
        .catch((err) => {
            console.error(err)
        });
};
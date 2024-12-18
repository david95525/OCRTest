var video = document.querySelector('video');
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

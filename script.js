const PRE = "DELTA";
const SUF = "MEET";
let room_id;
let local_stream;
let screenStream;
let peer = null;
let currentPeer = null;
let screenSharing = false;

const roomForm = document.getElementById('room-form');
roomForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Ngăn chặn gửi form mặc định của trình duyệt
    const roomInput = document.getElementById('room-input').value;
    const action = event.submitter.value;
    if (action === 'create') {
        createRoom(roomInput);
    } else if (action === 'join') {
        joinRoom(roomInput);
    }
});


function createRoom() {
    setTimeout(() => {
        const controlsBar = document.querySelector('.meet-controls-bar');
        controlsBar.style.display = "flex";
        const localVideo = document.querySelector('#local-video');
        localVideo.style.display = "block";
        const remoteVideo = document.querySelector('#remote-video');
        remoteVideo.style.display = "block";
    }, 2000);

    console.log("Creating Room");

    const room = document.getElementById("room-input").value.trim();

    if (!room) {
        alert("Please enter room number");
        return;
    }

    room_id = PRE + room + SUF;

    peer = new Peer(room_id);

    peer.on('open', (id) => {
        hideModal();

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                local_stream = stream;
                setLocalStream(local_stream);
                notify("Create Room Successfully");
            })
            .catch((err) => console.log(err));

        notify("Waiting for everyone to join.");
    });

    peer.on('call', (call) => {
        call.answer(local_stream);

        call.on('stream', (stream) => {
            setRemoteStream(stream);
        });

        currentPeer = call;
    });
}


function setLocalStream(stream) {
    const video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}

function setRemoteStream(stream) {
    const video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

function hideModal() {
    document.getElementById("entry-modal").hidden = true;
}

function notify(msg) {
    const notification = document.getElementById("notification");
    notification.innerHTML = msg;
    notification.hidden = false;
    setTimeout(() => {
        notification.hidden = true;
    }, 3000);
}

function joinRoom() {
    setTimeout(() => {
        const controlsBar = document.querySelector('.meet-controls-bar');
        controlsBar.style.display = "flex";
        const localVideo = document.querySelector('#local-video');
        localVideo.style.display = "block";
        const remoteVideo = document.querySelector('#remote-video');
        remoteVideo.style.display = "block";
    }, 2000);

    console.log("Joining Room");

    const room = document.getElementById("room-input").value.trim();

    if (!room) {
        alert("Please enter room number");
        return;
    }

    room_id = PRE + room + SUF;

    hideModal();

    peer = new Peer();

    peer.on('open', (id) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                local_stream = stream;
                setLocalStream(local_stream);
                notify("Joining room");

                const call = peer.call(room_id, stream);

                call.on('stream', (stream) => {
                    notify("Join Room Successfully");
                    setRemoteStream(stream);
                });

                currentPeer = call;
            })
            .catch((err) => console.log(err));
    });
}


function startScreenShare() {
    if (screenSharing) {
        return;
    }
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then((stream) => {
            screenStream = stream;
            let videoTrack = screenStream.getVideoTracks()[0];
            videoTrack.onended = () => {
                stopScreenSharing();
                notify("Screen sharing stopped.");
            }
            if (peer && currentPeer) {
                let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                })
                if (sender) {
                    sender.replaceTrack(videoTrack)
                    screenSharing = true;
                    notify("Screen sharing started.");
                } else {
                    notify("Failed to start screen sharing. No video sender found.");
                }
            } else {
                notify("Failed to start screen sharing. Peer connection not established.");
            }
            console.log(screenStream)
        })
        .catch((err) => {
            console.log(err)
            notify("Failed to start screen sharing. " + err.message);
        });
}

function stopScreenSharing() {
    if (!screenSharing) {
        return;
    }
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer && currentPeer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        if (sender) {
            sender.replaceTrack(videoTrack)
            screenSharing = false;
            notify("Screen sharing stopped.");
        } else {
            notify("Failed to stop screen sharing. No video sender found.");
        }
    } else {
        notify("Failed to stop screen sharing. Peer connection not established.");
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
}



function toggle() {
    document.querySelector('#local-video').classList.toggle('active')
    document.querySelector('#remote-video').classList.toggle('active')
}


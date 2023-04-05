
let peerConnection;
let localStream;
let remoteStream;
let isCaller;

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const callBtn = document.getElementById('call-btn');
const hangUpBtn = document.getElementById('hangup-btn');
configuration = {};
const socket = io();






callBtn.disabled = false;
hangUpBtn.disabled = true;

// Hàm lấy Media Stream và hiển thị trên localVideo
function getLocalStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = localStream;
            callBtn.disabled = false;
        })
        .catch(error => {
            console.log('Cannot access media devices:', error);
        });
}

// Hàm tạo Offer
function createOffer() {
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = handleICECandidateEvent;
    peerConnection.ontrack = handleTrackEvent;
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    isCaller = true;
    peerConnection.createOffer()
        .then(offer => {
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', { offer: offer, sender: socket.id, receiver: remoteSocketId });
        })
        .catch(error => {
            console.log('Cannot create offer:', error);
        });

    hangUpBtn.disabled = false;
    callBtn.disabled = true;
}

// Hàm nhận Offer
function receiveOffer(offer) {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection();
        peerConnection.onicecandidate = handleICECandidateEvent;
        peerConnection.ontrack = handleTrackEvent;
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    }

    peerConnection.setRemoteDescription(offer);
    peerConnection.createAnswer()
        .then(answer => {
            peerConnection.setLocalDescription(answer);
            socket.emit('answer', { target: offer.sender, answer: peerConnection.localDescription });
        })
        .catch(error => {
            console.log('Cannot create answer:', error);
        });

    hangUpBtn.disabled = false;
    callBtn.disabled = true;
}

// Hàm nhận Answer
function receiveAnswer(answer) {
    peerConnection.setRemoteDescription(answer);
}

// Hàm xử lý ICE Candidate Event
function handleICECandidateEvent(event) {
    if (event.candidate) {
        socket.emit('ice-candidate', { target: remoteSocketId, candidate: event.candidate });
    }
}

// Hàm xử lý Track Event
function handleTrackEvent(event) {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

// Hàm ngắt kết nối
function hangUpCall() {
    peerConnection.close();
    peerConnection = null;
    remoteVideo.srcObject = null;
    hangUpBtn.disabled = true;
    callBtn.disabled = false;
}
async function startCall(socket) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = stream;
        const peerConnection = new RTCPeerConnection(configuration);
        const callRecipient = '192.168.1.82';

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        peerConnection.ontrack = ({ streams: [stream] }) => {
            remoteVideo.srcObject = stream;
        };
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { offer, sender: socket.id, receiver: remoteUserId });
    } catch (err) {
        console.error('Failed to get local stream', err);
    }
}




// Gọi hàm lấy Media Stream
getLocalStream();

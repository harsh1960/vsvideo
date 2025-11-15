// Import Firestore functions
import { 
    collection, 
    addDoc, 
    setDoc, 
    getDoc, 
    doc, 
    onSnapshot, 
    updateDoc, 
    deleteDoc, 
    getDocs, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Get Firebase instances from global scope
const db = window.firebaseDb;

// ============ WEBRTC CONFIGURATION ============
const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
    ]
};

// ============ STATE MANAGEMENT ============
const state = {
    localStream: null,
    remoteStream: null,
    peerConnection: null,
    roomId: null,
    userId: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isInitiator: false,
    remoteUserId: null,
    unsubscribeOffers: null,
    unsubscribeAnswers: null,
    unsubscribeCandidates: null
};

// ============ DOM ELEMENTS ============
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomIdInput = document.getElementById('roomId');
const joinBtn = document.getElementById('joinBtn');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleAudioBtn = document.getElementById('toggleAudio');
const endCallBtn = document.getElementById('endCall');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const loadingSpinner = document.getElementById('loadingSpinner');
const remoteVideoContainer = document.getElementById('remoteVideoContainer');
const placeholder = document.getElementById('placeholder');
const statsPanel = document.getElementById('statsPanel');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 App initialized');
    setupEventListeners();
    await getUserMedia();
    generateRoomId();
});

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    joinBtn.addEventListener('click', joinRoom);
    roomIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom();
    });
    toggleVideoBtn.addEventListener('click', toggleVideo);
    toggleAudioBtn.addEventListener('click', toggleAudio);
    endCallBtn.addEventListener('click', endCall);
}

// ============ ROOM ID GENERATION ============
function generateRoomId() {
    const roomId = Math.random().toString(36).substring(2, 11).toUpperCase();
    roomIdInput.value = roomId;
    state.roomId = roomId;
}

// ============ MEDIA SETUP ============
async function getUserMedia() {
    try {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            }
        };

        state.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        localVideo.srcObject = state.localStream;
        console.log('✅ Local media stream obtained');
    } catch (error) {
        console.error('❌ Error accessing media devices:', error);
        alert('Please allow access to camera and microphone');
    }
}

// ============ TOGGLE CONTROLS ============
function toggleVideo() {
    if (!state.localStream) return;

    state.isVideoEnabled = !state.isVideoEnabled;
    state.localStream.getVideoTracks().forEach(track => {
        track.enabled = state.isVideoEnabled;
    });

    toggleVideoBtn.classList.toggle('inactive', !state.isVideoEnabled);
}

function toggleAudio() {
    if (!state.localStream) return;

    state.isAudioEnabled = !state.isAudioEnabled;
    state.localStream.getAudioTracks().forEach(track => {
        track.enabled = state.isAudioEnabled;
    });

    toggleAudioBtn.classList.toggle('inactive', !state.isAudioEnabled);
}

// ============ JOIN ROOM ============
async function joinRoom() {
    const roomId = roomIdInput.value.trim().toUpperCase();

    if (!roomId) {
        alert('Please enter or create a room ID');
        return;
    }

    if (!db) {
        alert('Firebase not initialized!');
        return;
    }

    state.roomId = roomId;
    state.userId = `user_${Date.now()}`;

    showLoading(true);

    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            // Room doesn't exist, create it
            console.log('📝 Creating new room:', roomId);
            state.isInitiator = true;

            await setDoc(roomRef, {
                created: new Date(),
                users: [state.userId]
            });

            setStatus('Waiting for connection...', false);
            showLoading(false);
            listenForOtherUsers();
        } else {
            const roomData = roomSnap.data();
            const users = roomData.users || [];

            if (users.length === 1 && users[0] !== state.userId) {
                // Second user joining
                console.log('👥 Second user joining, initiating connection');
                state.isInitiator = false;
                state.remoteUserId = users[0];

                // Add current user to room
                await updateDoc(roomRef, {
                    users: [...users, state.userId]
                });

                showLoading(false);
                setStatus('Connecting...', false);
                await createPeerConnection();
            } else if (users.length === 0 || (users.length === 1 && users[0] === state.userId)) {
                // First user, wait for second
                console.log('⏳ Waiting for another user...');
                state.isInitiator = true;

                await updateDoc(roomRef, {
                    users: [...new Set([...users, state.userId])]
                });

                setStatus('Waiting for connection...', false);
                showLoading(false);
                listenForOtherUsers();
            } else {
                alert('Room is full! Only 2 people can join.');
                showLoading(false);
                return;
            }
        }

        joinBtn.disabled = true;
        roomIdInput.disabled = true;

    } catch (error) {
        console.error('❌ Error joining room:', error);
        alert('Error joining room: ' + error.message);
        showLoading(false);
    }
}

// ============ LISTEN FOR OTHER USERS ============
function listenForOtherUsers() {
    const roomRef = doc(db, 'rooms', state.roomId);

    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
        const roomData = snapshot.data();

        if (roomData) {
            const users = roomData.users || [];
            const otherUsers = users.filter(uid => uid !== state.userId);

            if (otherUsers.length > 0 && !state.peerConnection && state.isInitiator) {
                console.log('🔗 Other user detected, initiating connection');
                state.remoteUserId = otherUsers[0];
                state.isInitiator = true;

                setStatus('Connecting...', false);
                await createPeerConnection();
            } else if (otherUsers.length === 0 && state.peerConnection) {
                // Remote user disconnected
                console.log('👋 Remote user disconnected');
                endCall();
            }
        }
    });

    // Store unsubscribe function for cleanup
    state.unsubscribeOtherUsers = unsubscribe;
}

// ============ CREATE PEER CONNECTION ============
async function createPeerConnection() {
    if (state.peerConnection) {
        console.log('🔗 Peer connection already exists');
        return;
    }

    try {
        state.peerConnection = new RTCPeerConnection({ iceServers: config.iceServers });

        // Add local stream tracks
        state.localStream.getTracks().forEach(track => {
            state.peerConnection.addTrack(track, state.localStream);
        });

        // Handle remote stream
        state.peerConnection.ontrack = (event) => {
            console.log('✅ Remote track received:', event.track.kind);
            if (event.streams && event.streams[0]) {
                state.remoteStream = event.streams[0];
                remoteVideo.srcObject = state.remoteStream;
                remoteVideoContainer.style.display = 'block';
                placeholder.style.display = 'none';
                setStatus('Connected', true);
                startStatsMonitoring();
            }
        };

        // Handle ICE candidates
        state.peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                console.log('📤 Sending ICE candidate');
                try {
                    await addDoc(collection(db, 'rooms', state.roomId, 'candidates'), {
                        from: state.userId,
                        to: state.remoteUserId,
                        candidate: event.candidate.candidate,
                        sdpMLineIndex: event.candidate.sdpMLineIndex,
                        sdpMid: event.candidate.sdpMid,
                        timestamp: new Date()
                    });
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        };

        // Handle connection state changes
        state.peerConnection.onconnectionstatechange = () => {
            console.log('🔗 Connection state:', state.peerConnection.connectionState);
            if (state.peerConnection.connectionState === 'disconnected' ||
                state.peerConnection.connectionState === 'failed' ||
                state.peerConnection.connectionState === 'closed') {
                endCall();
            }
        };

        if (state.isInitiator) {
            console.log('📝 Creating offer...');
            const offer = await state.peerConnection.createOffer();
            await state.peerConnection.setLocalDescription(offer);

            // Send offer to Firestore
            const offerRef = doc(db, 'rooms', state.roomId, 'offers', state.userId);
            await setDoc(offerRef, {
                from: state.userId,
                to: state.remoteUserId,
                sdp: offer.sdp,
                type: 'offer',
                timestamp: new Date()
            });

            console.log('📤 Offer sent');
            listenForAnswer();
        } else {
            // Listen for offer
            listenForOffer();
        }

        // Listen for ICE candidates from remote
        listenForRemoteCandidates();

    } catch (error) {
        console.error('❌ Error creating peer connection:', error);
    }
}

// ============ LISTEN FOR OFFER ============
function listenForOffer() {
    const offersQuery = query(
        collection(db, 'rooms', state.roomId, 'offers'),
        where('to', '==', state.userId)
    );

    const unsubscribe = onSnapshot(offersQuery, async (snapshot) => {
        snapshot.docs.forEach(async (doc) => {
            const offerData = doc.data();

            if (offerData && offerData.from !== state.userId && !state.peerConnection.remoteDescription) {
                try {
                    console.log('📥 Offer received');
                    const offer = new RTCSessionDescription({
                        type: 'offer',
                        sdp: offerData.sdp
                    });

                    await state.peerConnection.setRemoteDescription(offer);

                    console.log('📝 Creating answer...');
                    const answer = await state.peerConnection.createAnswer();
                    await state.peerConnection.setLocalDescription(answer);

                    // Send answer to Firestore
                    const answerRef = doc(db, 'rooms', state.roomId, 'answers', state.userId);
                    await setDoc(answerRef, {
                        from: state.userId,
                        to: offerData.from,
                        sdp: answer.sdp,
                        type: 'answer',
                        timestamp: new Date()
                    });

                    console.log('📤 Answer sent');
                } catch (error) {
                    console.error('❌ Error handling offer:', error);
                }
            }
        });
    });

    state.unsubscribeOffers = unsubscribe;
}

// ============ LISTEN FOR ANSWER ============
function listenForAnswer() {
    const answersQuery = query(
        collection(db, 'rooms', state.roomId, 'answers'),
        where('to', '==', state.userId)
    );

    const unsubscribe = onSnapshot(answersQuery, async (snapshot) => {
        snapshot.docs.forEach(async (doc) => {
            const answerData = doc.data();

            if (answerData && answerData.from !== state.userId && !state.peerConnection.remoteDescription) {
                try {
                    console.log('📥 Answer received');
                    const answer = new RTCSessionDescription({
                        type: 'answer',
                        sdp: answerData.sdp
                    });

                    await state.peerConnection.setRemoteDescription(answer);
                    console.log('✅ Answer set');
                } catch (error) {
                    console.error('❌ Error handling answer:', error);
                }
            }
        });
    });

    state.unsubscribeAnswers = unsubscribe;
}

// ============ LISTEN FOR ICE CANDIDATES ============
function listenForRemoteCandidates() {
    const candidatesQuery = query(
        collection(db, 'rooms', state.roomId, 'candidates'),
        where('from', '==', state.remoteUserId),
        where('to', '==', state.userId)
    );

    const unsubscribe = onSnapshot(candidatesQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const candidateData = change.doc.data();
                try {
                    if (state.peerConnection && state.peerConnection.remoteDescription) {
                        const candidate = new RTCIceCandidate({
                            candidate: candidateData.candidate,
                            sdpMLineIndex: candidateData.sdpMLineIndex,
                            sdpMid: candidateData.sdpMid
                        });

                        await state.peerConnection.addIceCandidate(candidate);
                        console.log('📥 ICE candidate added');
                    }
                } catch (error) {
                    console.error('❌ Error adding ICE candidate:', error);
                }
            }
        });
    });

    state.unsubscribeCandidates = unsubscribe;
}

// ============ END CALL ============
async function endCall() {
    console.log('🛑 Ending call');

    if (state.peerConnection) {
        state.peerConnection.close();
        state.peerConnection = null;
    }

    state.remoteStream = null;
    remoteVideo.srcObject = null;
    remoteVideoContainer.style.display = 'none';
    placeholder.style.display = 'flex';
    statsPanel.style.display = 'none';

    // Unsubscribe from listeners
    if (state.unsubscribeOffers) state.unsubscribeOffers();
    if (state.unsubscribeAnswers) state.unsubscribeAnswers();
    if (state.unsubscribeCandidates) state.unsubscribeCandidates();
    if (state.unsubscribeOtherUsers) state.unsubscribeOtherUsers();

    // Remove user from database
    if (state.roomId && state.userId) {
        try {
            const roomRef = doc(db, 'rooms', state.roomId);
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                const users = roomData.users || [];
                const updatedUsers = users.filter(u => u !== state.userId);

                if (updatedUsers.length === 0) {
                    // Delete room if no users left
                    await deleteDoc(roomRef);
                    console.log('🗑️ Room deleted');
                } else {
                    // Update room with remaining users
                    await updateDoc(roomRef, {
                        users: updatedUsers
                    });
                }
            }

            // Clean up offers, answers, candidates
            const offersSnap = await getDocs(collection(db, 'rooms', state.roomId, 'offers'));
            offersSnap.forEach(doc => deleteDoc(doc.ref));

            const answersSnap = await getDocs(collection(db, 'rooms', state.roomId, 'answers'));
            answersSnap.forEach(doc => deleteDoc(doc.ref));

            const candidatesSnap = await getDocs(collection(db, 'rooms', state.roomId, 'candidates'));
            candidatesSnap.forEach(doc => deleteDoc(doc.ref));

        } catch (error) {
            console.error('Error cleaning up database:', error);
        }
    }

    // Reset UI
    joinBtn.disabled = false;
    roomIdInput.disabled = false;
    setStatus('Waiting for connection...', false);
}

// ============ UI HELPERS ============
function setStatus(text, isConnected = false) {
    statusText.textContent = text;
    statusDot.classList.toggle('connected', isConnected);
}

function showLoading(show) {
    loadingSpinner.classList.toggle('active', show);
}

// ============ STATS MONITORING ============
function startStatsMonitoring() {
    statsPanel.style.display = 'flex';

    const updateStats = async () => {
        if (!state.peerConnection) return;

        try {
            const stats = await state.peerConnection.getStats();

            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    document.getElementById('bytesReceived').textContent = formatBytes(report.bytesReceived);
                }
                if (report.type === 'outbound-rtp' && report.kind === 'video') {
                    document.getElementById('bytesSent').textContent = formatBytes(report.bytesSent);
                }
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    const quality = report.currentRoundTripTime < 0.05 ? 'Excellent' :
                        report.currentRoundTripTime < 0.1 ? 'Good' :
                            report.currentRoundTripTime < 0.2 ? 'Fair' : 'Poor';
                    document.getElementById('connectionQuality').textContent = quality;
                }
            });
        } catch (error) {
            console.error('❌ Error getting stats:', error);
        }

        if (state.peerConnection) {
            setTimeout(updateStats, 1000);
        }
    };

    updateStats();
}

// ============ UTILITIES ============
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('🎥 VideoConnect Firestore Edition loaded');

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
    getDocs
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
    remoteUserId: null,
    unsubscribeOffers: null,
    unsubscribeAnswers: null,
    unsubscribeCandidates: null,
    unsubscribeOtherUsers: null,
    localDescriptionSet: false
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
    console.log('📝 Joining room:', roomId, 'as user:', state.userId);

    try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
            // First user - create room
            console.log('📝 Creating new room:', roomId);
            await setDoc(roomRef, {
                created: new Date(),
                users: [state.userId]
            });

            setStatus('Waiting for connection...', false);
            showLoading(false);
            listenForSecondUser();

        } else {
            const roomData = roomSnap.data();
            const users = roomData.users || [];
            console.log('📊 Room exists with users:', users);

            if (users.length === 0) {
                // Room empty, add self
                console.log('⏳ Room empty, adding self');
                await updateDoc(roomRef, { users: [state.userId] });
                setStatus('Waiting for connection...', false);
                showLoading(false);
                listenForSecondUser();

            } else if (users.length === 1 && !users.includes(state.userId)) {
                // Second user joining
                console.log('👥 Second user joining - peer 1 is:', users[0]);
                state.remoteUserId = users[0];
                
                // Add self to room
                await updateDoc(roomRef, {
                    users: [...users, state.userId]
                });

                setStatus('Connecting...', false);
                showLoading(false);
                
                // Create peer connection as initiator (we just joined, so we create the offer)
                setTimeout(() => {
                    console.log('⏰ Starting peer connection...');
                    createPeerConnection();
                }, 1000);

            } else {
                alert('Room is full! Maximum 2 people allowed.');
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
        joinBtn.disabled = false;
        roomIdInput.disabled = false;
    }
}

// ============ LISTEN FOR SECOND USER ============
function listenForSecondUser() {
    console.log('👂 Listening for second user...');
    const roomRef = doc(db, 'rooms', state.roomId);

    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
        if (!snapshot.exists()) return;

        const roomData = snapshot.data();
        const users = roomData.users || [];
        console.log('📊 Users in room now:', users);

        const otherUsers = users.filter(uid => uid !== state.userId);

        // If another user joined
        if (otherUsers.length > 0 && !state.peerConnection) {
            console.log('🔗 Another user joined! Creating connection...');
            state.remoteUserId = otherUsers[0];
            setStatus('Connecting...', false);
            
            setTimeout(() => {
                createPeerConnection();
            }, 500);
        }

        // If other user left
        if (otherUsers.length === 0 && state.peerConnection) {
            console.log('👋 Other user left');
            endCall();
        }
    });

    state.unsubscribeOtherUsers = unsubscribe;
}

// ============ CREATE PEER CONNECTION ============
async function createPeerConnection() {
    if (state.peerConnection) {
        console.log('⚠️ Peer connection already exists');
        return;
    }

    try {
        console.log('🔨 Creating RTCPeerConnection...');
        state.peerConnection = new RTCPeerConnection({ iceServers: config.iceServers });

        // ===== ADD LOCAL TRACKS =====
        console.log('📤 Adding local tracks...');
        state.localStream.getTracks().forEach(track => {
            console.log('  ├─ Adding:', track.kind);
            state.peerConnection.addTrack(track, state.localStream);
        });

        // ===== HANDLE REMOTE TRACKS =====
        state.peerConnection.ontrack = (event) => {
            console.log('✅ Remote track event:', event.track.kind);
            console.log('   Streams:', event.streams.length);
            
            if (event.streams && event.streams.length > 0) {
                console.log('📹 Setting remote stream');
                state.remoteStream = event.streams[0];
                remoteVideo.srcObject = state.remoteStream;
                
                // Ensure video plays
                remoteVideo.play().catch(e => console.log('Play error:', e));
                
                // Show remote video container
                remoteVideoContainer.style.display = 'block';
                placeholder.style.display = 'none';
                
                setStatus('Connected', true);
                startStatsMonitoring();
            }
        };

        // ===== HANDLE ICE CANDIDATES =====
        state.peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                console.log('🧊 ICE candidate generated');
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
                    console.error('❌ Error adding ICE candidate:', error);
                }
            }
        };

        // ===== HANDLE CONNECTION STATE =====
        state.peerConnection.onconnectionstatechange = () => {
            console.log('🔗 Connection state:', state.peerConnection.connectionState);
            if (state.peerConnection.connectionState === 'disconnected' ||
                state.peerConnection.connectionState === 'failed' ||
                state.peerConnection.connectionState === 'closed') {
                console.log('❌ Connection lost, ending call');
                endCall();
            }
        };

        // ===== CREATE OFFER OR WAIT FOR OFFER =====
        // Both peers will create offer and listen for answer
        // First one to listen gets the answer, establishes connection
        console.log('📝 Creating offer...');
        const offer = await state.peerConnection.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true
        });

        console.log('⚙️ Setting local description...');
        await state.peerConnection.setLocalDescription(offer);
        state.localDescriptionSet = true;
        console.log('✅ Local description set');

        // Send offer to Firestore
        const offerRef = doc(db, 'rooms', state.roomId, 'offers', state.userId);
        await setDoc(offerRef, {
            from: state.userId,
            to: state.remoteUserId,
            sdp: offer.sdp,
            type: 'offer',
            timestamp: new Date()
        });
        console.log('📤 Offer sent to Firestore');

        // Listen for answer
        listenForAnswer();

        // Also listen for incoming offers (in case other peer also creates offer)
        listenForOffer();

    } catch (error) {
        console.error('❌ Error creating peer connection:', error);
    }
}

// ============ LISTEN FOR OFFER ============
function listenForOffer() {
    console.log('👂 Listening for incoming offers...');
    const offersRef = collection(db, 'rooms', state.roomId, 'offers');

    const unsubscribe = onSnapshot(offersRef, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const offerData = change.doc.data();
                console.log('📥 Offer received from:', offerData.from);

                // Only process if from remote user and we haven't set remote description yet
                if (offerData.from === state.remoteUserId && 
                    state.peerConnection && 
                    !state.peerConnection.remoteDescription) {
                    
                    try {
                        console.log('🎯 Processing offer...');
                        const offer = new RTCSessionDescription({
                            type: 'offer',
                            sdp: offerData.sdp
                        });

                        await state.peerConnection.setRemoteDescription(offer);
                        console.log('✅ Remote description set (offer)');

                        // Create and send answer
                        console.log('📝 Creating answer...');
                        const answer = await state.peerConnection.createAnswer({
                            offerToReceiveAudio: true,
                            offerToReceiveVideo: true
                        });

                        await state.peerConnection.setLocalDescription(answer);
                        console.log('✅ Local description set (answer)');

                        // Send answer
                        const answerRef = doc(db, 'rooms', state.roomId, 'answers', state.userId);
                        await setDoc(answerRef, {
                            from: state.userId,
                            to: offerData.from,
                            sdp: answer.sdp,
                            type: 'answer',
                            timestamp: new Date()
                        });
                        console.log('📤 Answer sent to Firestore');
                    } catch (error) {
                        console.error('❌ Error handling offer:', error);
                    }
                }
            }
        });
    });

    state.unsubscribeOffers = unsubscribe;
}

// ============ LISTEN FOR ANSWER ============
function listenForAnswer() {
    console.log('👂 Listening for incoming answers...');
    const answersRef = collection(db, 'rooms', state.roomId, 'answers');

    const unsubscribe = onSnapshot(answersRef, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const answerData = change.doc.data();
                console.log('📥 Answer received from:', answerData.from);

                // Only process if from remote user and we haven't set remote description yet
                if (answerData.from === state.remoteUserId && 
                    state.peerConnection && 
                    !state.peerConnection.remoteDescription) {
                    
                    try {
                        console.log('🎯 Processing answer...');
                        const answer = new RTCSessionDescription({
                            type: 'answer',
                            sdp: answerData.sdp
                        });

                        await state.peerConnection.setRemoteDescription(answer);
                        console.log('✅ Remote description set (answer)');
                    } catch (error) {
                        console.error('❌ Error handling answer:', error);
                    }
                }
            }
        });
    });

    state.unsubscribeAnswers = unsubscribe;
}

// ============ LISTEN FOR ICE CANDIDATES ============
function listenForRemoteCandidates() {
    console.log('👂 Listening for ICE candidates...');
    const candidatesRef = collection(db, 'rooms', state.roomId, 'candidates');

    const unsubscribe = onSnapshot(candidatesRef, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const candidateData = change.doc.data();

                if (candidateData.from === state.remoteUserId && 
                    candidateData.to === state.userId) {
                    
                    try {
                        if (state.peerConnection && state.peerConnection.remoteDescription) {
                            console.log('🧊 Adding ICE candidate');
                            const candidate = new RTCIceCandidate({
                                candidate: candidateData.candidate,
                                sdpMLineIndex: candidateData.sdpMLineIndex,
                                sdpMid: candidateData.sdpMid
                            });

                            await state.peerConnection.addIceCandidate(candidate);
                            console.log('✅ ICE candidate added');
                        }
                    } catch (error) {
                        if (error.message && !error.message.includes('operation not supported')) {
                            console.error('❌ Error adding ICE candidate:', error);
                        }
                    }
                }
            }
        });
    });

    state.unsubscribeCandidates = unsubscribe;
}

// ============ END CALL ============
async function endCall() {
    console.log('🛑 Ending call');

    // Stop listening for candidates when offer/answer are set
    const answersRef = collection(db, 'rooms', state.roomId, 'answers');
    onSnapshot(answersRef, () => {
        if (state.peerConnection && state.peerConnection.remoteDescription) {
            listenForRemoteCandidates();
        }
    }, { onlyOnce: true });

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

    // Remove from database
    if (state.roomId && state.userId) {
        try {
            const roomRef = doc(db, 'rooms', state.roomId);
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                const users = roomData.users || [];
                const updatedUsers = users.filter(u => u !== state.userId);

                if (updatedUsers.length === 0) {
                    await deleteDoc(roomRef);
                    console.log('🗑️ Room deleted');
                } else {
                    await updateDoc(roomRef, { users: updatedUsers });
                }
            }

            // Clean up offers, answers, candidates
            const offersSnap = await getDocs(collection(db, 'rooms', state.roomId, 'offers'));
            offersSnap.forEach(d => deleteDoc(d.ref));

            const answersSnap = await getDocs(collection(db, 'rooms', state.roomId, 'answers'));
            answersSnap.forEach(d => deleteDoc(d.ref));

            const candidatesSnap = await getDocs(collection(db, 'rooms', state.roomId, 'candidates'));
            candidatesSnap.forEach(d => deleteDoc(d.ref));

        } catch (error) {
            console.error('❌ Error cleaning up:', error);
        }
    }

    // Reset UI
    joinBtn.disabled = false;
    roomIdInput.disabled = false;
    setStatus('Waiting for connection...', false);
    state.localDescriptionSet = false;
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

console.log('🎥 VideoConnect Firestore Edition - FIXED VERSION loaded');

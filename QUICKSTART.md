# VideoConnect - Firestore Edition 🎥

A **serverless**, **low-latency** video calling app built with WebRTC + Firebase Firestore (no npm/server needed!)

## ⚡ Quick Start (2 Steps)

### 1️⃣ Setup Firestore
- Go to [Firebase Console](https://console.firebase.google.com)
- Select project: **vsvideo-e2511** (already created!)
- Go to **Build** → **Firestore Database**
- Click **Create Database** → **Test mode** → **Enable**
- Update security rules (see `FIRESTORE_SETUP.md`)

### 2️⃣ Start Calling
- Open `index.html` in browser
- Share room ID with friend
- Both click "Join Room"
- Video and audio connect automatically ✅

---

## 📁 Files

| File | Purpose |
|------|---------|
| `index.html` | Main app + Firebase init |
| `styles.css` | Beautiful UI styling |
| `app.js` | WebRTC + Firestore logic |
| `FIRESTORE_SETUP.md` | Detailed Firestore setup |
| `README.md` | Full documentation |

---

## ✨ Features

✅ **No Server Required** - Firestore handles everything  
✅ **No Installation** - No npm or Node.js needed  
✅ **Low Latency** - Direct P2P video/audio  
✅ **Modern UI** - Beautiful gradient design  
✅ **Mobile Responsive** - Works on all devices  
✅ **Real-Time Stats** - Connection quality monitoring  
✅ **Audio Controls** - Toggle mic/camera on/off  
✅ **Auto-Connect** - Connects when both users online  

---

## 🚀 How It Works

```
┌─────────────────┐                    ┌─────────────────┐
│   Browser 1     │ ◄──── P2P ────► │   Browser 2     │
│   (User A)      │   WebRTC         │   (User B)      │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         └─── Firestore Signaling ──────────────┘
            (SDP Offers/Answers)
            (ICE Candidates)
```

**Result:** Direct peer-to-peer connection with minimal latency!

---

## 🔧 Your Setup

Your Firebase credentials are **already configured** in `index.html`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDAVC4AQpXIAcQQEOLTruMqg-6Dy0St7mU",
    authDomain: "vsvideo-e2511.firebaseapp.com",
    projectId: "vsvideo-e2511",
    // ... already set up!
};
```

✅ **No changes needed!** Just enable Firestore.

---

## 📞 Usage

**First User:**
1. Open `index.html` → Room ID auto-generates (e.g., `ABC123XY`)
2. Click "Join Room"
3. See "Waiting for connection..."
4. Share the Room ID with friend

**Second User:**
1. Open `index.html`
2. Enter the Room ID
3. Click "Join Room"
4. **Auto-connects!** 🎉

**Controls:**
- 🎥 Camera button - Toggle video on/off
- 🎤 Microphone button - Toggle audio on/off
- 🔴 Red button - End call

---

## 📊 Connection Quality

Once connected, you'll see:
- **Connection Quality** - Excellent/Good/Fair/Poor
- **Bytes Sent** - Upload data
- **Bytes Received** - Download data

Updated in real-time!

---

## 🌍 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Firefox | ✅      | ✅     |
| Safari  | ✅      | ✅     |
| Edge    | ✅      | ✅     |

---

## ⚠️ Important Notes

1. **Setup Firestore** - Must enable in Firebase Console
2. **Update Security Rules** - Follow `FIRESTORE_SETUP.md`
3. **Camera/Mic Access** - Browser will ask for permission
4. **No Recording** - App doesn't store calls by default
5. **Test Mode Rules** - For development only, update for production

---

## 🎯 Testing

### Test Locally (Two Tabs)
1. Open `index.html` in Tab 1
2. Open `index.html` in Tab 2
3. Use same room ID in both
4. Should connect instantly! ✅

### Test with Friends
1. Share `index.html` link (host on server/Firebase Hosting)
2. Share room ID
3. Both open and join room
4. Video call over internet! 📞

---

## 🐛 Troubleshooting

### App shows "Firebase not initialized"
→ Refresh page, console should show no errors

### "Permission denied" when connecting
→ Enable Firestore (see `FIRESTORE_SETUP.md` Step 1)  
→ Publish security rules (Step 2)

### Can't see remote video
→ Check browser console (F12) for errors  
→ Make sure other user allowed camera access

### "PERMISSION_DENIED" error in console
→ Security rules not published yet  
→ Go to Firestore → Rules → Click **Publish**

---

## 📚 More Info

- Firestore setup: `FIRESTORE_SETUP.md`
- Complete docs: `README.md`
- Firebase: [firebase.google.com](https://firebase.google.com)
- WebRTC: [webrtc.org](https://webrtc.org)

---

## 💡 Quick Checklist

- [ ] Enable Firestore in Firebase Console
- [ ] Update security rules
- [ ] Click "Publish" on rules
- [ ] Open `index.html` in browser
- [ ] Test with 2 windows/browsers
- [ ] Share with friends! 🎉

---

## 🎉 You're Ready!

1. ✅ Firebase project already created
2. ✅ App already configured with your credentials
3. ✅ Just need to enable Firestore (see `FIRESTORE_SETUP.md`)
4. ✅ Start video calling!

**Happy calling!** 🚀

---

**VideoConnect © 2025 - Built with ❤️ using WebRTC + Firestore**


# Firestore Setup Guide for VideoConnect

Your Firebase project is already created! Now you need to set up Firestore.

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **vsvideo-e2511**
3. Go to **Build** → **Firestore Database**
4. Click **Create Database**
5. Choose location closest to you (or default)
6. Start in **Test mode** (for development)
7. Click **Enable**

✅ Firestore is now enabled!

---

## Step 2: Create Firestore Security Rules

1. In Firestore, go to **Rules** tab
2. Replace all content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read/write to rooms and their subcollections
    match /rooms/{roomId} {
      allow read, write: if true;
      match /offers/{offerId} {
        allow read, write: if true;
      }
      match /answers/{answerId} {
        allow read, write: if true;
      }
      match /candidates/{candidateId} {
        allow read, write: if true;
      }
    }
  }
}
```

3. Click **Publish**

⚠️ **Note:** These are test rules for development. For production, use more restrictive rules.

---

## Step 3: Verify Configuration

The Firebase config in `index.html` is already set:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDAVC4AQpXIAcQQEOLTruMqg-6Dy0St7mU",
    authDomain: "vsvideo-e2511.firebaseapp.com",
    projectId: "vsvideo-e2511",
    storageBucket: "vsvideo-e2511.firebasestorage.app",
    messagingSenderId: "726237224056",
    appId: "1:726237224056:web:154e3ba2a1c9e13dda218d"
};
```

✅ Already configured in `index.html`!

---

## Step 4: Test the Setup

1. Open `index.html` in your browser
2. Check browser console (F12 → Console)
3. Look for message: **"🎥 VideoConnect Firestore Edition loaded"**
4. If no errors, you're ready! ✅

---

## Step 5: Test Video Calling

### Test with Two Windows:

**Window 1:**
1. Open `index.html`
2. See auto-generated Room ID (e.g., `A1B2C3D4`)
3. Click **"Join Room"**
4. Status shows "Waiting for connection..."

**Window 2:**
1. Open `index.html`
2. Enter the same Room ID
3. Click **"Join Room"**
4. Both should connect! 🎉

---

## How Firestore Collection Structure Works

When you connect, Firestore creates this structure:

```
rooms/
├── ROOMID1/
│   ├── (document) - has users array
│   ├── offers/
│   │   └── user_12345 - { sdp, type, from, to }
│   ├── answers/
│   │   └── user_67890 - { sdp, type, from, to }
│   └── candidates/
│       ├── candidate_1 - { candidate, from, to }
│       ├── candidate_2 - { candidate, from, to }
│       └── ...
```

---

## Troubleshooting

### "Permission denied" error
→ Make sure security rules are published  
→ Go to Firestore → Rules → Click **Publish**

### App doesn't load
→ Check browser console (F12) for errors  
→ Verify Firebase config in `index.html`

### Can't connect to other user
→ Make sure both use SAME room ID  
→ Check Firestore has "rooms" collection created  
→ Wait 1-2 seconds, connection takes time

### No video from remote user
→ Check both users allowed camera access  
→ Look at browser console for WebRTC errors

---

## Firestore Pricing

- **Free Tier:** 50,000 read/write operations per day
- **Sufficient for:** Testing, small projects
- **For production:** Will need upgraded plan

---

## Production Setup

For production:

1. **Update Security Rules** - Make them more restrictive
2. **Enable HTTPS** - Required for WebRTC
3. **Update Firestore Rules** - Only allow authenticated users
4. **Monitor Quota** - Check usage in Firebase Console

---

## Your Setup is Complete! 🎉

1. ✅ Firebase project created
2. ✅ Firestore enabled
3. ✅ Security rules set
4. ✅ App configured with your credentials

**Ready to use!**

Open `index.html` and start video calling! 📞

---

## Next Steps

1. Open `index.html` in browser
2. Generate a room ID
3. Share with friend
4. Both click "Join Room"
5. Start calling! 🚀

Need help? Check browser console (F12) for errors.

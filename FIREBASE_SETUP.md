# Firebase Setup Guide for VideoConnect

## Step-by-Step Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: `videocall-app`
4. Click **"Continue"**
5. Disable Google Analytics (optional)
6. Click **"Create project"**
7. Wait for project to be created

### 2. Create Realtime Database
1. In Firebase Console, go to **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Select location closest to you
4. Start in **"Test mode"** (for development)
5. Click **"Enable"**

### 3. Get Firebase Configuration
1. In Firebase Console, go to **"Project Settings"** (gear icon)
2. Scroll down to **"Your apps"** section
3. If no web app exists, click **"</>  Add app"**
4. Choose **"Web"**
5. Enter app name: `videocall`
6. Check **"Also set up Firebase Hosting"** (optional)
7. Click **"Register app"**
8. You'll see your Firebase config like this:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD...",
    authDomain: "videocall-app-xxxxx.firebaseapp.com",
    projectId: "videocall-app-xxxxx",
    storageBucket: "videocall-app-xxxxx.appspot.com",
    messagingSenderId: "1234567890",
    databaseURL: "https://videocall-app-xxxxx-default-rtdb.firebaseio.com",
    appId: "1:1234567890:web:abcdef1234567890"
};
```

### 4. Update app.js with Your Config
1. Open `app.js` in your editor
2. Find this section (around line 5-14):
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    databaseURL: "YOUR_DATABASE_URL",
    appId: "YOUR_APP_ID"
};
```

3. Replace with your actual config from Firebase Console
4. Save the file

### 5. Set Database Security Rules
1. In Firebase Console, go to **"Realtime Database"** → **"Rules"**
2. Replace the default rules with:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "users": {
          "$userId": {
            ".read": true,
            ".write": "auth.uid == $userId || root.child('rooms').child($roomId).child('users').child(auth.uid).exists()"
          }
        },
        "offer": {
          ".read": true,
          ".write": true
        },
        "answer": {
          ".read": true,
          ".write": true
        },
        "candidates": {
          "$userId": {
            ".read": true,
            ".write": true
          }
        }
      }
    }
  }
}
```

3. Click **"Publish"**

### 6. Test Your Setup
1. Open `index.html` in your browser
2. You should see the app loaded without Firebase errors
3. Check browser console (F12 → Console tab) for any errors
4. If you see "Firebase initialized successfully", you're good to go!

---

## Testing the App

### Test with Two Users

**Browser 1:**
1. Open `http://localhost:5500/index.html` (or use Live Server)
2. A random room ID is generated (e.g., `A1B2C3D4`)
3. Click **"Join Room"**
4. You'll see "Waiting for connection..."

**Browser 2:**
1. Open `http://localhost:5500/index.html` in another tab/window
2. Enter the same room ID from Browser 1
3. Click **"Join Room"**
4. Both should connect automatically
5. You should see the remote video and audio

---

## Troubleshooting

### "Firebase not configured" alert
- Check you replaced all "YOUR_*" values in `firebaseConfig`
- Make sure no values are still `"YOUR_API_KEY"`

### Connection doesn't work
- Check browser console (F12) for errors
- Make sure Firebase Realtime Database is created
- Verify security rules are published
- Check Firebase quota (free tier has limits)

### "Permission denied" errors
- Go back to step 5 and ensure security rules are updated
- Click "Publish" to apply the rules

### Can't see remote video
- Make sure both users allowed camera/microphone access
- Check browser console for WebRTC errors
- Verify both users are in the same room ID
- Check network connection

---

## Production Deployment

For production, change the security rules to be more restrictive:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": false,
        ".write": false,
        "users": {
          "$userId": {
            ".validate": "newData.child('status').val() === 'waiting' || newData.child('status').val() === 'ready'"
          }
        }
      }
    }
  }
}
```

---

## Firebase Pricing

- **Free Tier:** Good for development and small usage
- **Realtime Database:** 100 concurrent connections, 1GB storage
- Pricing based on data transferred and storage

For more info: [Firebase Pricing](https://firebase.google.com/pricing)

---

## Next Steps

Once Firebase is configured:
1. Open the app in your browser
2. Share room ID with a friend
3. Both open the room ID and click "Join Room"
4. Start video calling! 🎥

**Note:** No npm/Node.js installation needed! Everything works in the browser.

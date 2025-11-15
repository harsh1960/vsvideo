# VideoConnect - Peer-to-Peer Video Calling Application

A modern, low-latency video calling application built with WebRTC and Socket.io.

## Features

✨ **Key Features:**
- **Peer-to-Peer Video & Audio** - Direct connection for low latency
- **Real-Time Communication** - Uses WebRTC for secure, direct peer connections
- **Modern UI** - Beautiful, responsive design with gradient effects
- **Connection Quality Monitoring** - Real-time stats display (RTT, bytes sent/received)
- **Audio/Video Controls** - Toggle camera and microphone on/off
- **Room-Based Connections** - Share room ID to connect with friends
- **Automatic STUN Servers** - Multiple Google STUN servers for NAT traversal
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Node.js, Express, Socket.io
- **Protocol:** WebRTC for media, Socket.io for signaling

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Setup

1. **Navigate to the project directory:**
```bash
cd videocall
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the signaling server:**
```bash
npm start
```

The server will start on `http://localhost:3000`

4. **Open your browser:**
- Navigate to `http://localhost:3000`
- Share the room ID with your friend
- Click "Join Room" on both sides to connect

## How It Works

### Architecture

```
┌─────────────────────────────────────┐
│      Browser 1 (User A)             │
│  ┌──────────────────────────────┐   │
│  │   WebRTC PeerConnection      │   │
│  │  (Low Latency Media Stream)  │   │
│  └──────────────────────────────┘   │
│             │                        │
│             │ (Media)                │
│             │ (Peer-to-Peer)         │
│             │                        │
│  ┌──────────────────────────────┐   │
│  │  Socket.io Connection        │   │
│  │  (Signaling Only)            │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
             │
             │ (Signaling)
             │
    ┌────────┴────────┐
    │   Node Server   │
    │  Signaling Hub  │
    └────────┬────────┘
             │
             │ (Signaling)
             │
┌─────────────────────────────────────┐
│      Browser 2 (User B)             │
│  ┌──────────────────────────────┐   │
│  │  Socket.io Connection        │   │
│  │  (Signaling Only)            │   │
│  └──────────────────────────────┘   │
│             │                        │
│             │ (Media)                │
│             │ (Peer-to-Peer)         │
│             │                        │
│  ┌──────────────────────────────┐   │
│  │   WebRTC PeerConnection      │   │
│  │  (Low Latency Media Stream)  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Connection Flow

1. **User A joins a room** - Server stores user ID and room
2. **User B joins the same room** - Server notifies both users
3. **User A creates an Offer** - WebRTC offer is sent via Socket.io
4. **User B receives Offer and creates Answer** - Answer is sent back
5. **ICE Candidates exchanged** - Both sides exchange candidates for NAT traversal
6. **Direct Peer Connection established** - Media flows directly between users
7. **Low-latency video/audio** - No server involvement in media streaming

## Usage

### Starting a Call
1. Open the application in your browser
2. The site automatically generates a unique room ID
3. Share the room ID with your friend (via chat, email, etc.)
4. Both users click "Join Room" with the same room ID
5. Once both are in the same room, connection starts automatically

### Control Buttons
- **Camera Button** - Toggle video on/off
- **Microphone Button** - Toggle audio on/off  
- **Red Button** (when connected) - End the call

### Connection Stats
Once connected, you'll see:
- **Connection Quality** - Excellent/Good/Fair/Poor based on latency
- **Bytes Sent** - Total video data sent
- **Bytes Received** - Total video data received

## Configuration

### Server Settings
Edit `server.js` to change:
- **PORT** - Default is 3000
- **CORS origins** - For production, restrict to your domain

### Client Settings
Edit `app.js` to change:
- **signalingServer** - Point to your server URL
- **Video quality** - Adjust width/height constraints
- **Audio settings** - Echo cancellation, noise suppression, etc.

```javascript
// In app.js, update this line:
state.signalingServer = 'http://your-domain.com:3000'
```

## Deployment

### Deploy to Production

1. **Prepare your server:**
   - Get a domain name
   - Set up SSL/HTTPS certificate (required for WebRTC)
   - Use a production Node.js hosting service

2. **Update configuration:**
   - Change `signalingServer` in `app.js` to your production URL
   - Update CORS settings in `server.js`

3. **Production Hosting Options:**
   - **Heroku** - Easy Node.js deployment
   - **AWS EC2** - Full control
   - **DigitalOcean** - Simple and affordable
   - **Railway.app** - Modern hosting platform
   - **Render** - Easy deployment with HTTPS

4. **Example Heroku Deployment:**
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create Heroku app
heroku create your-app-name

# Push to Heroku
git push heroku main

# Open app
heroku open
```

## Performance Tips

1. **Use HTTPS** - Required for WebRTC in production
2. **Optimize video bitrate** - Adjust constraints based on network
3. **Monitor connection quality** - Use stats panel to diagnose issues
4. **Use WebRTC stats** - Check RTT and packet loss
5. **Test on real networks** - VPNs and firewalls may affect connections

## Troubleshooting

### "No camera/microphone access"
- Check browser permissions
- Ensure you're using HTTPS
- Try a different browser

### "Can't connect to server"
- Verify server is running (`npm start`)
- Check server URL in `app.js`
- Check firewall settings

### "Remote video not showing"
- Check both users' internet connection
- Verify firewall allows WebRTC (port 0, UDP)
- Check browser console for errors

### "Audio/video lag"
- Check network latency (stats panel)
- Reduce video resolution
- Close other bandwidth-heavy apps
- Try a wired connection

### "Can't see stats"
- Wait a few seconds after connection
- Check browser console for errors
- Verify peer connection is established

## Browser Compatibility

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome  | ✅      | ✅     |
| Firefox | ✅      | ✅     |
| Safari  | ✅      | ✅     |
| Edge    | ✅      | ✅     |

## Security Considerations

- **HTTPS only** - Always use HTTPS in production
- **Room IDs** - Share room IDs through secure channels
- **Firewall** - Configure firewall for WebRTC (usually port 0, UDP)
- **STUN servers** - Uses Google's public STUN servers (can be changed)
- **No recording** - Application doesn't record calls by default

## API Documentation

### Socket.io Events

**Client to Server:**
- `join-room` - Join a room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate

**Server to Client:**
- `room-users` - List of users in room
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `ice-candidate` - Receive ICE candidate
- `user-disconnected` - User left room

## Future Enhancements

- [ ] Screen sharing
- [ ] Chat messaging
- [ ] Recording capability
- [ ] Contacts list
- [ ] Call history
- [ ] Multi-party conferencing
- [ ] Custom themes
- [ ] Bandwidth limiting
- [ ] Call quality adjustment
- [ ] File sharing

## License

MIT License - Feel free to use for personal or commercial projects

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review browser console for errors
3. Check Socket.io/WebRTC documentation
4. Submit an issue on GitHub

## Credits

- WebRTC API - W3C Standard
- Socket.io - Real-time communication
- Express - Web framework
- Google STUN servers - NAT traversal

---

**Happy video calling! 🎥📞**

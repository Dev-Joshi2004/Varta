import React, { useEffect, useRef, useState } from 'react';
import styles from '../style/videoComponent.module.css';
import { TextField, Button, IconButton, colors, Badge } from '@mui/material';
import { io } from 'socket.io-client';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEnd from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';

const server_url = 'http://localhost:5000/';

var connection = {};

const peerConfiguration = {
    "iceServers": [
        {
            "urls": 'stun:stun.l.google.com:19302',
        }
    ]
}
export default function VartaVideoComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);

    let [audio, setAudio] = useState();

    let [screenSharing, setScreenSharing] = useState();

    let [showModal, setShowModal] = useState();

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);

    let [userMessage, setUserMessage] = useState('');

    let [newMessages, setNewMessages] = useState(4);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState('');

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    const getPermission = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
            }
            else {
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
            }
            else {
                setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }
            else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        getPermission();
    }, []);

    let handleVideoToggle = async () => {
        let nextVideoState = !video;
        setVideo(nextVideoState);
    
        // CASE 1: Video OFF karni hai (Proper Black Screen bhejni hai)
        if (nextVideoState === false) {
            console.log("Switching to Black Screen...");
    
            // 1. Apne local camera track ko band karo (Hardware light turns off)
            if (window.localStream) {
                window.localStream.getVideoTracks().forEach(track => {
                    track.enabled = false;
                });
            }
    
            // 2. Fake black track create karo
            let blackTrack = black();
    
            // 3. Saare connected peers ke paas black track replace karke bhej do
            for (let id in connection) {
                let senders = connection[id].getSenders();
                let videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                
                if (videoSender && blackTrack) {
                    videoSender.replaceTrack(blackTrack);
                }
            }
        } 
        // CASE 2: Video wapas ON karni hai (Camera dynamic reload)
        else {
            console.log("Restoring Camera Stream...");
    
            try {
                // 1. Fresh camera tracks mangao browser se
                let freshStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: audioAvailable });
                let freshVideoTrack = freshStream.getVideoTracks()[0];
    
                // 2. Apne main localStream ke video track ko naye live track se badlo
                if (window.localStream && freshVideoTrack) {
                    let oldVideoTrack = window.localStream.getVideoTracks()[0];
                    if (oldVideoTrack) {
                        window.localStream.removeTrack(oldVideoTrack);
                        oldVideoTrack.stop(); // Purane track ko memory se clean kiya
                    }
                    window.localStream.addTrack(freshVideoTrack);
                }
    
                // 3. Apni screen wapas live video feed par sync karo
                if (localVideoRef.current && window.localStream) {
                    localVideoRef.current.srcObject = window.localStream;
                }
    
                // 4. Peers ke pass black track hatakar fresh camera track replace karo
                for (let id in connection) {
                    let senders = connection[id].getSenders();
                    let videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                    
                    if (videoSender && freshVideoTrack) {
                        videoSender.replaceTrack(freshVideoTrack);
                    }
                }
            } catch (error) {
                console.log("Camera fail to start on toggle:", error);
                setVideo(false);
            }
        }
    }

    let handleAudioToggle = () => {
        setAudio(!audio);
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop());
        }
        catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connection){
            if(id === socketIdRef.current) continue;
            window.localStream.getTracks().forEach(track => {
                connection[id].addTrack(track, window.localStream);
            })

            connection[id].createOffer().then((description) => {
                connection[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connection[id].localDescription }))
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreenSharing(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {
                console.log(e);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            getUserMedia();
        })
    }

    let getDisplayMedia = () => {
        if(screenAvailable === true){
            if(navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({video : true, audio : true}).then(getDisplayMediaSuccess).then((stream) => {}).catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if(screenSharing !== undefined){
            getDisplayMedia();
        }
    })

    let handleScreen = () => {
        setScreenSharing(!screenSharing);
    }

    let getUserMediaSuccess = (stream) => {
        try {

            window.localStream.getTracks().forEach(track => { track.stop() });
        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for (let id in connection) {
            if (id === socketIdRef.current) continue;
            window.localStream.getTracks().forEach(track => {
                connection[id].addTrack(track, window.localStream);
            })

            connection[id].createOffer().then((description) => {
                connection[id].setLocalDescription(description).then(() => {
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connection[id].localDescription }))
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch (e) {
                console.log(e);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for (let id in connection) {
                window.localStream.getTracks().forEach(track => {
                    connection[id].addTrack(track, window.localStream);
                })
                connection[id].createOffer().then((description) => {
                    connection[id].setLocalDescription(description).then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connection[id].localDescription }))
                    }).catch(e => console.log(e));
                }).catch(e => console.log(e));
            }
        })
    }

    let getUserMedia = async () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((err) => {
                    console.log(err);
                })
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch {

            }
        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connection[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {

                        connection[fromId].createAnswer().then((description) => {
                            connection[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connection[fromId].localDescription }))
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }

            if (signal.ice) {
                connection[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            })

            socketRef.current.on('user-joined', (id, clients) => {
                if (!clients || clients.length === 0) {
                    console.log("No clients in the room");
                    return;
                }
                clients.forEach((socketListId) => {
                    if (connection[socketListId] !== undefined) {
                        return;
                    }
                    connection[socketListId] = new RTCPeerConnection(peerConfiguration);

                    connection[socketListId].onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    connection[socketListId].ontrack = (event) => {
                        const remoteStream = event.streams[0];

                        setVideos((prevVideos) => {
                            const videoExists = prevVideos.some(video => video.socketId === socketListId);
                            if (videoExists) {
                                return prevVideos.map((video) =>
                                    video.socketId === socketListId ? { ...video, stream: remoteStream } : video
                                );
                            }
                            else {
                                let newVideos = {
                                    socketId: socketListId,
                                    stream: remoteStream,
                                    autoPlay: true,
                                    playsinline: true
                                }
                                return [...prevVideos, newVideos];
                            }
                        })
                    }

                    if (window.localStream !== undefined && window.localStream !== null) {
                        window.localStream.getTracks().forEach(track => {
                            connection[socketListId].addTrack(track, window.localStream);
                        })
                    }
                    else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        window.localStream.getTracks().forEach(track => {
                            connection[socketListId].addTrack(track, window.localStream);
                        })
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connection) {
                        if (id2 === socketIdRef.current) continue;

                        try {
                            window.localStream.getTracks().forEach(track => {
                                connection[id2].addTrack(track, window.localStream);
                            })
                        } catch {

                        }

                        connection[id2].createOffer().then((description) => {
                            connection[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connection[id2].localDescription }))
                            }).catch(e => console.log(e));
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        try {
            let ctx = new AudioContext();
            let oscillator = ctx.createOscillator();
            let dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            ctx.resume();
            let track = dst.stream.getAudioTracks()[0];
            if (track) {
                return track;
            }
        } catch (e) {
            console.log("Silence track error:", e);
        }
        
        return null;
    }
    
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement('canvas'), { width, height });
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        let stream = canvas.captureStream(1); 
        let track = stream.getVideoTracks()[0];
        if (track) {
            return track;
        }
        return null;
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    return (
        <div>

            {askForUsername === true ?
                <div>
                    <h2>Enter To Lobby</h2>
                    <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
                    <Button variant="contained" onClick={connect}>Connect</Button>
                    <div>
                        <video ref={localVideoRef} autoPlay muted></video>
                    </div>
                </div> :

                <div className={styles.vartaVideoContainer}>

                    <div className={styles.buttonContainer}>
                        <IconButton onClick={handleVideoToggle} style={{ color: 'white' }}>
                            {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleAudioToggle} style={{ color: "white" }}>
                            {(audio === true) ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        {screenAvailable === true ?
                            <IconButton onClick={handleScreen} style={{ color: "white"}}>
                                {(screenSharing === true) ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                            :
                            <></>
                        }

                        <Badge badgeContent={newMessages} max={999} color='error'>
                            <IconButton style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                        <IconButton style={{ color: "white" , backgroundColor: 'red' , width: '90px', height: '40px',borderRadius: '8px' }}>
                            <CallEnd />
                        </IconButton>
                    </div>
                    <video className={styles.userVideo} ref={localVideoRef} autoPlay muted></video>

                    <div className={styles.conferenceView} key={video.socketId}>
                        {videos.filter((v, index, self) => self.findIndex(t => t.socketId === v.socketId) === index)
                            .map((video) => (

                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                ></video>
                            )
                        )}
                    </div> 
                </div>
            }

        </div>
    )
}
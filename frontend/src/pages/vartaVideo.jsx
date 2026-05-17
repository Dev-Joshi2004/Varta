import React, { useEffect, useRef, useState } from 'react';
import '../style/videoComponent.css';
import {TextField , Button} from '@mui/material';
import {io} from 'socket.io-client';


const server_url = 'http://localhost:5000/';

var connection = {};

const peerConfiguration = {
    "iceServers" : [
        {
            "urls" : 'stun:stun.l.google.com:19302',
        }
    ]
}
export default function VartaVideoComponent(){

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

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState('');

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    const getPermission = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
            if(videoPermission){
                setVideoAvailable(true);
            }
            else{
                setVideoAvailable(false);
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({audio: true});
            if(audioPermission){
                setAudioAvailable(true);
            }
            else{
                setAudioAvailable(false);
            }

            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            }
            else{
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable){
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});

                if(userMediaStream){
                    window.localStream = userMediaStream;
                    if(localVideoRef.current){
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch(err){
            console.log(err);
        }
    }

    useEffect(() => {
        getPermission();
    },[]);

    let getUserMediaSuccess = (stream) => {
        try{

            window.localStream.getTracks().forEach(track => {track.stop()});
        } catch(e){
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;

        for(let id in connection){
            if(id === socketIdRef.current) continue;
            window.localStream.getTracks().forEach(track => {
                connection[id].addTrack(track,window.localStream);
            })

            connection[id].createOffer().then((description) => {
                connection[id].setLocalDescription(description).then(()=>{
                    socketRef.current.emit('signal', id, JSON.stringify({'sdp': connection[id].localDescription}))
                }).catch(e => console.log(e));
            }).catch(e => console.log(e));
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch(e){
                console.log(e);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;

            for(let id in connection){
                window.localStream.getTracks().forEach(track => {
                    connection[id].addTrack(track,window.localStream);
                })
                connection[id].createOffer().then((description) => {
                    connection[id].setLocalDescription(description).then(()=>{
                        socketRef.current.emit('signal', id, JSON.stringify({'sdp': connection[id].localDescription}))
                    }).catch(e => console.log(e));
                }).catch(e => console.log(e));
            }
        })
    }

    let getUserMedia = async () => {
        if((video && videoAvailable) || (audio && audioAvailable)){
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess)
            .then((stream)=>{})
            .catch((err)=>{
                console.log(err);
            })
        } else {
            try{
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            } catch{

            }
        }
    }

    useEffect(() => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    },[audio,video]);

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if(fromId !== socketIdRef.current){
            if(signal.sdp){
                connection[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if(signal.sdp.type === 'offer'){

                        connection[fromId].createAnswer().then((description) => {
                            connection[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({'sdp': connection[fromId].localDescription}))
                            }).catch(e => console.log(e));
                        }).catch(e => console.log(e)); 
                    }
                }).catch(e => console.log(e));
            }

            if(signal.ice){
                connection[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, {secure: false});

        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('user-left' , (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
            })

            socketRef.current.on('user-joined' ,(id,clients) => {
                if(!clients || clients.length === 0){
                    console.log("No clients in the room");
                    return;
                }
                clients.forEach((socketListId) => {
                    connection[socketListId] = new RTCPeerConnection(peerConfiguration);

                    connection[socketListId].onicecandidate = (event) => {
                        if(event.candidate){
                            socketRef.current.emit('signal', socketListId, JSON.stringify({'ice': event.candidate}))
                        }
                    }

                    connection[socketListId].ontrack = (event) => {
                        const remoteStream = event.streams[0];
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);
                        if(videoExists){
                            setVideos((prevVideos) => {
                                const updatedVideos = prevVideos.map((video) => {
                                    return video.socketId === socketListId ? { ...video, stream: remoteStream } : video;
                                })
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                        else{

                            let newVideos = {
                                socketId: socketListId,
                                stream: remoteStream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(prevVideos => {
                                const updatedVideos = [...prevVideos, newVideos];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }
                    }

                    if(window.localStream !== undefined && window.localStream !== null){
                        window.localStream.getTracks().forEach(track => {
                            connection[socketListId].addTrack(track,window.localStream);
                        })
                    }
                    else{
                        //let blackSilence
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        window.localStream.getTracks().forEach(track => {
                            connection[socketListId].addTrack(track,window.localStream);
                        })
                    }
                })

                if(id === socketIdRef.current){
                    for(let id2 in connection){
                        if(id2 === socketIdRef.current) continue;

                        try{
                            window.localStream.getTracks().forEach(track => {
                                connection[id2].addTrack(track,window.localStream);
                            })
                        } catch {

                        }

                        connection[id2].createOffer().then((description)=>{
                            connection[id2].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal',id2,JSON.stringify({'sdp': connection[id2].localDescription}))
                            }).catch(e => console.log(e));
                        })
                    }
                }
            })
        })
    }

    let silence = () =>{
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
    }

    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement('canvas'), {width, height});
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});  
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

    return(
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
                <>
                    <video ref={localVideoRef} autoPlay muted></video>

                    {videos.map((video) => (
                        <div key={video.socketId}>
                            <h2>{video.socketId}</h2>
                            <video 
                                data-socket = {video.socketId}
                                ref = {ref => {
                                    if(ref && video.stream){
                                        ref.srcObject = video.stream;
                                    }
                                }}
                                autoPlay
                            ></video>
                        </div>
                    ))}
                </>
            }

        </div>
    )
}
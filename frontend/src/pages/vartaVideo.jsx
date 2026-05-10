import React, { useRef, useState } from 'react';
import '../style/videoComponent.css';


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

    let [video, setVideo] = useState();

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

    return(
        <div>

            {askForUsername === true ? 
                <div>

                </div> : <></>
            }

        </div>
    )
}
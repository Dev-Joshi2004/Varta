import React, { useContext, useState } from "react";
import Auth from "../utils/Auth";
import { useNavigate } from "react-router-dom";
import styles from "../style/home.module.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {

    let Navigate = useNavigate();

    const [meetingCode, setMeetingCode] = useState("");

    const {addUserHistory} = useContext(AuthContext);

    let handleJoinCall = async () => {
        await addUserHistory(meetingCode);
        Navigate(`/${meetingCode}`)
    }
    return (
        <>
            <div className={styles.navbar}>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Varta</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" , gap: "20px"}}>
                    <div style={{display: "flex" , alignItems: "center"}}>
                        <IconButton >
                            <RestoreIcon />
                        </IconButton>

                        <p>History</p>
                    </div>

                    <Button onClick={e => {
                        localStorage.removeItem("token");
                        Navigate("/auth");
                    }}>Log Out</Button>
                </div>
            </div>

            <div className={styles.homeMainContainer}>
                <div className={styles.homeContainerText} >
                    <h2><span style={{color: "#3995ff"}}>Connecting</span> million of hearts daily</h2>
                    <div style={{display: "flex" , gap: "10px"}}>
                        <TextField label = "Meeting Code" value={meetingCode} onChange={e => setMeetingCode(e.target.value)} />
                        <Button onClick={handleJoinCall} variant="contained">Join</Button>
                    </div>
                </div>
                <div className={styles.homeContainerImg}>
                    <img src="/home.png" alt="" />
                </div>
            </div>
        </>
    )
}

export default Auth(HomeComponent);
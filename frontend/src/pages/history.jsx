import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);

    const [meetings , setMeetings] = useState([]);

    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            }
            catch {

            }
        }

        fetchHistory();
    },[]);

    return (
        <div>
            <h1>History</h1>
        </div>
    )
}
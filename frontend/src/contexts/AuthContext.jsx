import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: 'http://localhost:5000/api/v1/users'
})

export const AuthProvider = ({children}) => {
    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(authContext);

    const router = useNavigate();

    const handleRegister = async (name,username,password) => {
        try {
            let req = await client.post('/register', {
                name: name,
                username: username,
                password: password
            })
            if(req.status === httpStatus.CREATED){
                return req.data.message;
            }
        }catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username,password) => {
        try{
            let req = await client.post('/login',{
                username: username,
                password: password
            })
            if(req.status === httpStatus.OK){
                localStorage.setItem('token', req.data.token);
                localStorage.setItem('showWelcome','true');
                router('/home');
                return req.data.message;
            }
        }catch(err){
            throw err;
        }
    }

    const getUserHistory = async () => {
        try {
            let request = await client.get('/get_all_activity', {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data.history;
        } catch(e) {
            throw e;
        }
    }

    const addUserHistory = async (meeting_code) => {
        try{
            let request = await client.post('/add_to_activity' , {
                token : localStorage.getItem("token"),
                meeting_code : meeting_code,
            });
            return request.status;
        } catch(e) {
            throw e;
        }
    }

    const data = {
        userData, setUserData , handleRegister , handleLogin , getUserHistory , addUserHistory
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}
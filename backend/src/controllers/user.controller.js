import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import httpStatus from 'http-status';
import bcrypt,{ hash } from 'bcrypt'
import crypto from 'crypto'


dotenv.config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL,process.env.REACT_APP_SUPABASE_ANON_KEY);

const login = async (req,res) => {
    const { username,password } = req.body;

    if(!username || !password) {
        return res.status(400).json({message: "Username and Password are required"});
    }
    try{
        const { data:user,error:fetchError} = await supabase
        .from('User')
        .select('username,password')
        .eq('username',username)
        .maybeSingle();

        console.log("Supabase Response:", user, "Error:", fetchError);

        if(fetchError || !user){
            return res.status(httpStatus.NOT_FOUND).json({message: "User not found. Please register first"});
        }

        const isPasswordValid = await bcrypt.compare(password,user.password);

        if(isPasswordValid){
            let token = crypto.randomBytes(20).toString('hex');

            user.token = token;

            const {data,error:updateError} = await supabase
            .from('User')
            .update({token: token})
            .eq('username',username);

            if(updateError) throw updateError;
            return res.status(httpStatus.OK).json({token: token});
        }else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Password" });
        }
    }catch(e){
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: `Something went wrong: ${e.message}`});
    }
}

const register = async (req,res) => {
    const { name,username,password } = req.body;

    try{
        const {data:existingUser,error:fetchError} = await supabase
        .from('User')
        .select('username')
        .eq('username',username)
        .single();

        if(existingUser) {
            return res.status(httpStatus.FOUND).json({message: "Username already exists"});
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const {data,error:insertError} = await supabase
        .from('User')
        .insert([{ name: name, username: username, password: hashedPassword}]);

        if(insertError) throw insertError;

        return res.status(httpStatus.CREATED).json({message: "User registered successfully"});
    }catch(e){
        console.log("Error logic mein: ",e);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message: e.message});
    }
}

const getUserHistory = async (req,res) => {
    const {token} = req.query;

    try{
        const user = await supabase.from('User').select('*').eq('token',token).single();
        const meetingHistory = await supabase.from('Meeting').select('*').eq('user_id',user.data.id);
        return res.status(httpStatus.FOUND).json({history : meetingHistory.data});
    } catch(e) {
        res.json({message : `Something went wrong : ${e}`});
    }
}

const addMeetingToHistory = async (req, res) => {
    const { token, meeting_code } = req.body;

    if (!token || !meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Token and meeting code are required" });
    }

    try {
        // 1. User dhoondho token se
        const { data: userData, error: userError } = await supabase
            .from('User')
            .select('id')
            .eq('token', token)
            .maybeSingle(); 

        if (userError || !userData) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid or expired session token" });
        }

        console.log(`Adding meeting history for User ID: ${userData.id}`);

        // 2. Meeting record insert karo
        const { data, error: insertError } = await supabase
            .from('Meeting')
            .insert([{ 
                user_id: userData.id, 
                meeting_code: meeting_code 
            }]);

        if (insertError) throw insertError;

        return res.status(httpStatus.CREATED).json({ message: "Meeting added to history successfully" });
    } catch (e) {
        console.error("History logging error:", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message}` });
    }
}

export {login, register , getUserHistory , addMeetingToHistory };
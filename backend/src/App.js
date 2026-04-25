import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import connectToServer from './controllers/socketManager.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({limit: "40kb"}));
app.use(express.urlencoded({limit: "40kb", extended: true}))
dotenv.config();
app.use("/api/v1/users", userRoutes);

app.set("port",5000);

const server = createServer(app);
const io = connectToServer(server);

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL,process.env.REACT_APP_SUPABASE_ANON_KEY);

server.listen(app.get("port"), () => console.log("Server running on port 5000"));
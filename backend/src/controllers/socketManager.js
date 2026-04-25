import { Server, Socket } from "socket.io";

let messages = {};

const connectToServer = (server)=>{
    const io = new Server(server,{
        cors: {
            origin: "*",
            methods: ['GET','POST'],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket)=>{
        console.log("User connected: " , socket.id);

        socket.on("join-call",(roomPath)=>{

            socket.join(roomPath);
            if(messages[roomPath] !== undefined){
                messages[roomPath].forEach((msg) => {
                    io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg.socketId);
                });
            }
            socket.to(roomPath).emit("user-joined", socket.id);
            console.log(`User ${socket.id} joined room: ${roomPath}`);
        });

        socket.on("signal" ,(toId, message)=>{
            io.to(toId).emit("signal", socket.id,message);
        })

        socket.on("chat-message", (payload)=>{
            const { data, sender, roomPath } = payload;

            if (messages[roomPath] === undefined) {
                messages[roomPath] = [];
            }

            messages[roomPath].push({
                "data": data,
                "sender": sender,
                "socketId": socket.id
            });

            io.to(roomPath).emit("chat-message", data, sender, socket.id);

            console.log(`Message in ${roomPath} from ${sender}: ${data}`);
        })

        socket.on("disconnecting", () => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).emit("user-left", socket.id);
                    console.log(`User ${socket.id} left room: ${room}`);
                }
            });
        });

        socket.on("disconnect", ()=>{
            console.log("User disconnected: ",socket.id);
        })
    })

    return io;
}

export default connectToServer;
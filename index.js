const path = require('path');
const express = require('express');
const uuid = require('uuid');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3000
var listofuser=[];

app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, 'public')))

//http end points
app.get('/quick-chat/' , (req, res) => {
    res.redirect(`/quick-chat/${uuid.v4()}`)
})

app.get('/quick-chat/new', (req, res) => {
    res.redirect(`/quick-chat/${uuid.v4()}`)
})

app.get('/quick-chat/:room', (req, res) =>{
    res.render('chatroom', {room: req.params.room})
})

io.on('connection', (socket) =>{
    socket.on('join', ({room,name}) =>{
        listofuser.push(name)
        console.log(listofuser)
        socket.to(room).emit("joined_room",{name})
        socket.join(room)

        //update users
        updateUsers(socket);
        
    });
    socket.on('chat_message', (payload) =>{
        socket.to(payload.room).emit("chat_message", payload);
    })
    // image upload
   })
   function updateUsers(socket){
    // Make a list of all the clients nicknames
    nicknames = [];
    for (i=0 ; i<listofuser.length ; i++){
        nicknames.push(listofuser[i]);
    }

    // Tell all the clients which clients are currently in the chat-room
    socket.emit('update current users' , nicknames);
}

http.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})
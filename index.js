const path = require('path');
const express = require('express');
const uuid = require('uuid');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
fs = require('fs');
exec = require('child_process').exec;
util = require('util');

const port = 3000
var listofuser=[];
// Added by Saurabh
var Files = {};

// var app = require('http').createServer(handler)
//   , io = require('socket.io').listen(app)
//   , fs = require('fs')
//   , exec = require('child_process').exec
//   , util = require('util')

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

    // Added by Saurabh
    //Events will go here
    socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
        var Name = data['Name'];
        Files[Name] = {  //Create a new Entry in The Files Variable
            FileSize : data['Size'],
            Data     : "",
            Downloaded : 0
        }
        var Place = 0;
        try{
            var Stat = fs.statSync('Temp/' +  Name);
            if(Stat.isFile())
            {
                Files[Name]['Downloaded'] = Stat.size;
                Place = Stat.size / 524288;
            }
        }
        catch(er){} //It's a New File
        fs.open("Temp/" + Name, "a", 0755, function(err, fd){
            if(err)
            {
                console.log(err);
            }
            else
            {
                Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
                socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
            }
        });
    });
    
    socket.on('Upload', function (data){
        var Name = data['Name'];
        Files[Name]['Downloaded'] += data['Data'].length;
        Files[Name]['Data'] += data['Data'];
        if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
        {
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                var inp = fs.createReadStream("Temp/" + Name);
                var out = fs.createWriteStream("public/images/" + Name);
                inp.pipe(out);
                inp.on("end", function() {
                    fs.unlink("Temp/" + Name, function () { //This Deletes The Temporary File
                        //Moving File Completed
    
                        exec("ffmpeg -i public/images/" + Name  + " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg public/images/" + Name  + ".jpg", function(err){
                            // socket.emit('Done', {'Image' : 'public/images/' + Name + '.jpg'});
                            socket.emit('Done', {'Image' : Name});
                        });
    
                    });

                })
            });
        }
        else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
            fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
                Files[Name]['Data'] = ""; //Reset The Buffer
                var Place = Files[Name]['Downloaded'] / 524288;
                var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
                socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
            });
        }
        else
        {
            var Place = Files[Name]['Downloaded'] / 524288;
            var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
            socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
        }
    });
    
    socket.on('MoreData', function (data){
        UpdateBar(data['Percent']);
        var Place = data['Place'] * 524288; //The Next Blocks Starting Position
        var NewFile; //The Variable that will hold the new Block of Data
        if(SelectedFile.webkitSlice) 
            NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
        else
            NewFile = SelectedFile.mozSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
        FReader.readAsBinaryString(NewFile);
    });
    
    function UpdateBar(percent){
        document.getElementById('ProgressBar').style.width = percent + '%';
        document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
        var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
        document.getElementById('MB').innerHTML = MBDone;
    }
}

// // Added by saurabh.
// io.sockets.on('connection', function (socket) {
//     //Events will go here
//     socket.on('Start', function (data) { //data contains the variables that we passed through in the html file
//         var Name = data['Name'];
//         Files[Name] = {  //Create a new Entry in The Files Variable
//             FileSize : data['Size'],
//             Data     : "",
//             Downloaded : 0
//         }
//         var Place = 0;
//         try{
//             var Stat = fs.statSync('Temp/' +  Name);
//             if(Stat.isFile())
//             {
//                 Files[Name]['Downloaded'] = Stat.size;
//                 Place = Stat.size / 524288;
//             }
//         }
//         catch(er){} //It's a New File
//         fs.open("Temp/" + Name, "a", 0755, function(err, fd){
//             if(err)
//             {
//                 console.log(err);
//             }
//             else
//             {
//                 Files[Name]['Handler'] = fd; //We store the file handler so we can write to it later
//                 socket.emit('MoreData', { 'Place' : Place, Percent : 0 });
//             }
//         });
//     });
    
    
//     socket.on('Upload', function (data){
//         var Name = data['Name'];
//         Files[Name]['Downloaded'] += data['Data'].length;
//         Files[Name]['Data'] += data['Data'];
//         if(Files[Name]['Downloaded'] == Files[Name]['FileSize']) //If File is Fully Uploaded
//         {
//             fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
//                 var inp = fs.createReadStream("Temp/" + Name);
//                 var out = fs.createWriteStream("public/images/" + Name);
//                 util.pump(inp, out, function(){
//                     fs.unlink("Temp/" + Name, function () { //This Deletes The Temporary File
//                         //Moving File Completed
    
//                         exec("ffmpeg -i public/images/" + Name  + " -ss 01:30 -r 1 -an -vframes 1 -f mjpeg public/images/" + Name  + ".jpg", function(err){
//                             socket.emit('Done', {'Image' : 'public/images/' + Name + '.jpg'});
//                         });
    
//                     });
//                 });
//             });
//         }
//         else if(Files[Name]['Data'].length > 10485760){ //If the Data Buffer reaches 10MB
//             fs.write(Files[Name]['Handler'], Files[Name]['Data'], null, 'Binary', function(err, Writen){
//                 Files[Name]['Data'] = ""; //Reset The Buffer
//                 var Place = Files[Name]['Downloaded'] / 524288;
//                 var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
//                 socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
//             });
//         }
//         else
//         {
//             var Place = Files[Name]['Downloaded'] / 524288;
//             var Percent = (Files[Name]['Downloaded'] / Files[Name]['FileSize']) * 100;
//             socket.emit('MoreData', { 'Place' : Place, 'Percent' :  Percent});
//         }
//     });
    
//     socket.on('MoreData', function (data){
//         UpdateBar(data['Percent']);
//         var Place = data['Place'] * 524288; //The Next Blocks Starting Position
//         var NewFile; //The Variable that will hold the new Block of Data
//         if(SelectedFile.webkitSlice) 
//             NewFile = SelectedFile.webkitSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
//         else
//             NewFile = SelectedFile.mozSlice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
//         FReader.readAsBinaryString(NewFile);
//     });
    
//     function UpdateBar(percent){
//         document.getElementById('ProgressBar').style.width = percent + '%';
//         document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
//         var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
//         document.getElementById('MB').innerHTML = MBDone;
//     }
// });
 

http.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})


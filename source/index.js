/*
When we are creating a node server it can use both express and socket.io.
But ir requires to set-up express in a slightly different way than last time.
 */
const HTTP  = require('http'); //Used after socket.io

const path = require('path');
const express = require('express');
const socketIO = require('socket.io');

const app = express();

const server = HTTP.createServer //Used after or for using socket.io
(
    /*
    This will allow us to create a new web server and we pass the express application to it.
     */
    app //This is optional because express library performs this behind the scenes.
);

const io = socketIO
(
    server
); // Now with this our server accepts web sockets.

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');

const badWords = require('bad-words'); //Used to identify profanity language.

const {generateMessage,generateLocationMessage } =require('./utilities/messages');
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utilities/users');

app.use
(
    express.static(publicDirectoryPath)
);

/*let count = 0;*/ //Only for practice

io.on
(
    'connection', //This will fire whenever the socket.io server gets a new connection that is when a new client connects.
    (socket)=> //This socket is an object which contains info about the new connection.
    {
        console.log("New web socket connection");
        /*
        So, we could use methods on sockets to communicate with that specific client.
         */

        /*
        socket.emit
        (
            'countUpdatedEvent', //Name of the event. This event is used to send the initial count to the client and later used to send any changes to the count.
            count //Data which has to be sent to the client.
        );
        /!*
        This emit is used to send some data back to the newly connected client.

        When we are working with socket.io we are transferring data we are sending and receiving
        what so called events.
        So, now we send an event from the server and which is received that event on client-side.
         *!/

        socket.on
        (
            'incrementEvent', //This event is to receive increment action performed by the client.
            ()=>
            {
                console.log("Received count increment event");
                count++;

                /!*socket.emit //This is to send client a event that is to notify count increment.
                (
                    'countUpdatedEvent',count
                );*!/ //By this we only send event to a single connection,but to emit to every connection available.
                //We use:

                io.emit //This will emit to every single connection available.
                (
                    'countUpdatedEvent',count
                )
            }
        );
        */ //Commented both emit and on because this ia a practice.

        /*
        //Sending welcoming message when user connected.
        socket.emit
        (
            'message',
            generateMessage('Welcome user to this chat application')
        );

        socket.broadcast.emit //To broad event to other other client except to this client.
        (
            'message',
            generateMessage('A new client has joined the chatroom')
        );
        */ //These two emits are moved to join below

        //Receive username and room name
        socket.on
        (
            'join',
            ({username,room},callback /*Acknowledgment callback*/)=>
            {
                const {error,user} = addUser //Only one from both error or user returns.
                (
                    {
                        id : socket.id, //This is the unique identifier for that particular user connection.
                        username,
                        room
                    }
                );

                if (error)
                {
                    return callback(error);
                }

                socket.join
                (
                    user.room
                )
                /*
                This join() method is only used in server script.
                This allows us to join a given chat room, and we pass name of the room we
                are trying to join.

                This gives us access to a whole another way to emit events where we specifically
                emitting events to just that room.
                So, only others in that room would actually see that whether there messages
                or anything else we might be sending from server to client.

                Upto now we have seen three ways to send events from a server to client those are :
                socket.emit - Which sends an event to a specific client.
                io.emit - Which sends an event to every connected client.
                socket.broadcast.emit - Which send an event to all connected clients except to who calls it.

                Now, with rooms we have two more setups to emit events,
                One is the variation of io.emit and other is the variation of  socket.broadcast.emit.

                io.to.emit - This emits an event to everybody in a specific room.
                socket.broadcast.to.emit - This emits an event for everyone except to that calling
                                           client but it will limit it to a specific chat room.

                 Here to is a function which take the room name as the parameter.
                 */

                socket.emit
                (
                    'message',
                    generateMessage('Admin','Welcome user to this chat application')
                );

                socket.broadcast.to(user.room).emit
                    (
                        'message',
                        generateMessage('Admin',`${user.username} joined this chatroom`)
                    );

                //Now, populate the sidebar with current list of users in the room : (When new user comes)
                io.to(user.room).emit
                (
                    'roomData',
                    {
                        room : user.room,
                        users : getUsersInRoom(user.room)
                    }
                );

                callback(); //Without any error
            }
        )

        //Receive message from client
        socket.on
        (
            'sendMessage',
            (
                message,
                callback //We call this callback function to acknowledge the event.
            )=>
            {
                const user = getUser(socket.id);

                const filter = new badWords();

                if (filter.isProfane(message)) //Checking for profanity language in the message
                {
                    return callback('Profanity is not allowed');//So, we send error
                }

                //Then after receiving send that message to all other connected clients
                //io.emit //Commented after using rooms
                io.to(user.room).emit
                (
                    'message',generateMessage(user.username,message)
                );
                callback('Delivered');
                /*
                This is acknowledging the event.
                So, when server sends the acknowledgement back to the client it could also
                choose to provide some data by providing as arguments to the above callback.
                 */
            }
        );

        //Run some code when any client gets disconnected :
        socket.on
        (
            'disconnect', //Built-in event which will be fired when this certain user gets disconnected.
            ()=> //So, when this client gets disconnected we notify all other clients.
            {
                const user = removeUser(socket.id);

                if (user)
                {
                    //io.emit //Commented after using rooms
                    io.to(user.room).emit
                    (
                        'message',generateMessage('Admin',`${user.username} has left this chatroom`)
                    );

                    //Now, populate the sidebar with current list of users in the room : (When a user leaves)
                    io.to(user.room).emit
                    (
                        'roomData',
                        {
                            room : user.room,
                            users : getUsersInRoom(user.room)
                        }
                    );
                }

            }
        );

        socket.on
        (
            'sendLocation',
            (location,callback)=>
            {
                const user = getUser(socket.id);

                //When location is received send that to other clients.
                //io.emit //Commented after using rooms
                io.to(user.room).emit
                (
                    //'message',`Location : Latitude=${location.latitude}, Longitude=${location.longitude}`
                    //OR, for google maps
                    'locationMessage',
                    generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`)
                );
                callback('Delivered and shared with the clients'); //Acknowledgement
            }
        )
    }
);
/*
This singly not going to work we also need to load in the client side of the socket.io library.

Now when we set up a socket it also sets up a file to be served up that the clients can access.
So, we load that in client-side with adding a script tag in the index.html, the script we
load their is not a script that we have created, it is something that is served up because
we have configured our server to work with socket.io.

So, "/socket.io/socket.io.js" is a client side version of that library.

Next we need to do is to create our own client side JS file load that in and use what's
provided by the script "/socket.io/socket.io.js". That is in public->js->chat.js .
And also we add script with source to that chat.js .
 */

/*app.listen*/ //Commented after using socket.io
server.listen
(
    port,
    ()=>
    {
        console.log("Chat application running on port",port);
    }
);

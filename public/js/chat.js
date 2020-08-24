const socket = io();
/*
This is used to connect to the server.

This "socket" will allow us to send events and receive events from both the server and the client.
 */

/*
socket.on
    /!*
    This on is used to receive the events from the server.
     *!/
(
    'countUpdatedEvent',
    (receivedData)=> //Data which is sent by server.
    {
        console.log("Count Updated to",receivedData);
    }
);

document.querySelector("#increment").addEventListener
(
    'click',
    ()=>
    {
        socket.emit //This event is used to send data to server with incremented count when button is clicked.
        (
            'incrementEvent'
        );
    }
);
*/ //Commented because this is only for practice.

//Elements :
const $messageForm = document.querySelector("#message-form");//$ is used to represent that this variable contains the element selected from the DOM.
const $messageFormInput = $messageForm.querySelector("#message");
const $messageFormButton = $messageForm.querySelector("button");

const $messages = document.querySelector("#messages");

//Templates :
const $messageTemplate = document.querySelector("#message-template").innerHTML;
//innerHTML is used to get html inside the template to render.
const $locationTemplate = document.querySelector("#location-template").innerHTML;
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options :
const {username,room} = Qs.parse   //This location.search contains query string present in the URL.
(
    location.search,
    {
        ignoreQueryPrefix : true //Used to ignore "?" in the query string.
    }
);

//Auto scrolling logic :
const autoscroll = ()=>
{
    /*
    This is called when we render new messages.
     */

    // New message element :
    const $newMessage = $messages.lastElementChild;

    // Height of the new/last message :
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //Visible height :
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container :
    const containerHeight = $messages.scrollHeight;

    //How far have we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset)
    {
        $messages.scrollTop = $messages.scrollHeight; //Push to the bottom.
    }
}

//Receiving welcome message from server when user gets connected.
socket.on
(
    'message',
    (message)=>
    {
        console.log(message);

        /*
        To load the dynamic content, we need the template and place where we want to render
        the content.
         */
        const html = Mustache.render
        (
            $messageTemplate,
            {
                username : message.username,
                message:message.text, //Setting the value for dynamic content.
                createdAt: moment(message.createdAt).format('(hh:mm:ss A) Do MMMM YYYY')
            }
        ); //This stores the final html that will be rendered in the browser
        $messages.insertAdjacentHTML
        (
            'beforeend',html
        );
        autoscroll();
    }
);

//To receive locationMessage :
socket.on
(
    'locationMessage',
    (location)=>
    {
        console.log(location);

        const html = Mustache.render
        (
            $locationTemplate,
            {
                username : location.username,
                location:location.url,
                createdAt: moment(location.createdAt).format('(hh:mm:ss A) Do MMMM YYYY')
            }
        );

        $messages.insertAdjacentHTML
        (
            'beforeend',html
        );
        autoscroll();
    }
);

//Get updated users list has new users come or existing users leave : (And populate sidebar with list of users).
socket.on
(
    'roomData',
    ({room,users})=>
    {
        console.log(room,users);

        const html = Mustache.render
        (
            $sidebarTemplate,
            {
                room,
                users
            }
        );

        document.querySelector("#sidebar").innerHTML = html;
    }
);

$messageForm.addEventListener
(
    'submit',
    (e)=>
{
    e.preventDefault(); //Preventing the reload of the application.

    //Disable form when message is being sent
    $messageFormButton.setAttribute('disabled','true');

    const message = e.target.elements.message.value;
    socket.emit
    (
        'sendMessage',
        message,
        (acknowledgedResponse)=> //This function runs when event is acknowledged.
        {
            //Re-enable form after previous message is sent successfully.
            $messageFormButton.removeAttribute('disabled');

            //Clear input field after message is sent :
            $messageFormInput.value = '';

            //Also we could change the focus back to input field :
            $messageFormInput.focus();

            console.log('The message was successfully delivered to server with reply',acknowledgedResponse);
        }
    );
}
);

//Elements
const $sendLocationButton = document.querySelector("#sendLocation");

/* Sending a client location to all other clients with browser geolocation API : */
$sendLocationButton.addEventListener
(
    'click',
    ()=>
    {
        if (!navigator.geolocation) //Gives the client current geolocation.
        {
            /*
            If browser does not support geolocation API.
             */

            return alert('Geolocation API is not supported by your browser');
        }

        //Disable sendLocation button while the location is being sent to the server
        $sendLocationButton.setAttribute('disabled','true');

        navigator.geolocation.getCurrentPosition //This is a asynchronous
        (
            (position)=>
            {
                console.log("Your geolocation :",position);

                //Share latitude and longitude with other clients through server :
                socket.emit
                (
                    'sendLocation',
                    {
                        latitude : position.coords.latitude,
                        longitude : position.coords.longitude
                    },
                    (acknowledgementResponse)=>
                    {
                        //Re-enable sendLocation button after location is sent to the server
                        $sendLocationButton.removeAttribute('disabled');

                        console.log("Location successfully delivered to server with acknowledgement response",acknowledgementResponse)
                    }
                );
            }
        );
    }
);

/*
Event acknowledgement :
server (emit) -> client (receive)  --acknowledgement-->server.
client (emit) -> server (receive)  --acknowledgement-->client.
 */


//Emit username and room name to the server.
socket.emit
(
    'join',
    {
        username,
        room
    },
    (error)=> //Acknowledgement callback
    {
        if (error)
        {
            alert(error);

            location.href = '/'; //Redirect to home page that is join.
        }
    }
);

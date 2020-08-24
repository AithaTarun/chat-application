/*
Here we keep track of our users in the array.
 */

const users = [];

// Functions : addUser, removeUser, getUser, getUsersInRoom .

const addUser = ({id,username,room})=>
{
    /*
    This function takes a object 3 properties.
    Those are ID, username and room.

    Username and room comes from client. And ID will be associated with individual socket,
    so, every single connection to the server has a unique ID generated for it.
     */

    //Clean the data : Means covert to lowercase and trim the data.
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    //Validate the data
    if (!username || !room) //Empty
    {
        return{
            error : 'Username and room are required!'
        }
    }

    //Check for existing user : Reject already existed rooms or users
    const existingUser = users.find
    (
        (user)=>
        {
            return user.room === room && user.username === username;
        }
    );

    //Validate username :
    if (existingUser)
    {
        return {
            error : 'Username is already in use'
        }
    }

    //Store user
    const user =
        {
            id,
            username,
            room
        };
    users.push(user);
    return { user };

};

/*
//Testing for addUser() :
addUser
(
    {
        id : 22,
        username : 'Aitha',
        room : 'Room 1'
    }
);

addUser
(
    {
        id : 56,
        username : 'Tarun',
        room : 'Room 1'
    }
);

addUser
(
    {
        id : 22,
        username : 'Harry',
        room : 'Room 2'
    }
);

console.log(users);

const results = addUser
(
    {
        id : 44,
        username : '',
        room : ''
    }
);
console.log(results);
*/


const removeUser = (id)=>
{
    const index = users.findIndex
    (
        (user)=>
        {
            return user.id===id;
        }
    );

    //Did not find then index>=0.
    if (index!== -1)
    {
        //Found the user, so remove
        return users.splice(index,1)[0] //Remove items by their index.
    }
};

//Testing removeUser :
/*const removedUser = removeUser(22);
console.log(removedUser);
console.log(users);*/


const getUser = (id)=>
{
    return  users.find
    (
        (user)=>
        {
            return user.id === id;
        }
    );
};

/*
//Testing getUser :
console.log(getUser(22));
*/

const getUsersInRoom = (room)=>
{
    room= room.trim().toLowerCase();

    let returnUsers = [];

    return users.filter
    (
        (user)=>
        {
            return user.room === room;
        }
    );
};
/*

//Testing getUsersInRoom
console.log("Room 1 users :",getUsersInRoom('Room 1'));
console.log("Room 2 users :",getUsersInRoom('Room 2'));
*/

module.exports =
    {
        addUser,
        removeUser,
        getUser,
        getUsersInRoom
    };
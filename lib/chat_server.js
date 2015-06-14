/**
 * Created by MLS on 15/6/14.
 */
var socketio = require('socket.io'),
  io, guestNumber=1, nickNames= {}, namesUsed = [], currentRoom = {};
exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', function(socket){
    guestNumber = assginGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, '吐槽');

    handleMessageBroadcasting(socket);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);

  });
  function assginGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = '吐槽星人' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
      success:true,
      name:name
    });
    namesUsed.push(name);
    return guestNumber + 1;
  }
  function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room:room});
    socket.broadcast.to(room).emit('message',{
      text:nickNames[socket.id] + '加入了' + room
    });

    var usersInRoom = io.sockets.clients(room);
    if (usersInRoom.length >1) {
      var usersInRoomSummary = '欢迎加入'+ room;
      for (var index in usersInRoom) {
        var userSocketId = usersInRoom[index].id;
        console.log(userSocketId);
      }
      socket.emit('message', {text:usersInRoomSummary});
    }
  }
  function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name){
      if (name.indexOf('吐槽星人') == 0) {
        socket.emit('nameResult',{
          success:false,
          message:'你只能换成其他星球的人'
        });
      } else {
        if (namesUsed.indexOf(name) == -1) {
          var previousName = nickNames[socket.id];
          var previousNameIndex = namesUsed.indexOf(previousName);
          namesUsed.push(name);
          nickNames[socket.id] = name;
          delete namesUsed[previousNameIndex];
          socket.emit('nameResult', {
            success:true,
            name:name
          });
          socket.broadcast.to(currentRoom[socket.id]).emit('message',{
            text:previousName + "把名字换成了" + name
          });
        } else {
          socket.emit('nameResult', {
            success:false,
            message:'你的名字已被占用'
          });
        }
      }
    })
  }
  function handleMessageBroadcasting(socket) {
    socket.on('message', function(message){
      socket.broadcast.to(message.room).emit('message',{
        text:nickNames[socket.id] + ": " + message.text
      })
    });
  }
  function handleRoomJoining(socket) {
    socket.on('join', function(room){
      socket.leave(currentRoom[socket.id]);
      joinRoom(socket, room);
    });
  }
  function handleClientDisconnection(socket, nickNames, namesUsed) {
    socket.on('disconnect', function(){
      var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
      delete namesUsed[nameIndex];
      delete nickNames[socket.id];
    })
  }
}
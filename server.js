// gerekli packet importları
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const {
    Message,
    MessageInfo
} = require('./utils/message')
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getAllUsers,
    addMessageInfo,
    getMessages
} = require('./utils/users')
const { 
    addRoom, 
    allRooms, 
    joinRoom, 
    userExistInRoom, 
    addMessage, 
    getMessagesInRoom,
    clearRooms
} = require('./utils/rooms')
const { 
    addFile, 
    getFile 
} = require('./utils/files')

// Ssocket olusmasını ayarlamak icin
const app = express() //express uygulamayı http sunucusuna baglıyo ardından sunucuyu socketle baglantısını kuruyo
const server = http.createServer(app)
const io = socketio(server)

//  static dosysyı sunmak icin middleware funksiyonu html css gibi
app.use(express.static(path.join(__dirname, "public")))

const botName = "Chat Bot"  // Server adı

// İstemci bağlandığında çalışcak
io.on('connection', socket => {
    console.log("Client connected")
    // Müşteri uygulamaya katıldığında calıscak
    socket.on('joinApp', username => {
        const user = userJoin(socket.id,username)
        //// İstemciyi sisteme dahil etmek icin

      
        //  client da cevrimici kullanıcı bilgilerini gosterir
        io.emit("onlineUsers", {
            users: getAllUsers()
        })

      //  oda bilgilerini müşteriye göndermek icin
 // newRoom tüm odaları görüntüler, ancak yalnızca görüntülemek için yeni oluşturma işlemi yapmaya gerek kalmadan
        io.emit("newRoom", {
            rooms: allRooms()
        })
    })

    //  chatMessage  dinlemek icin
    socket.on("chatMessage", ({ msg, targetClientId, type }) => {
        const user = getCurrentUser(socket.id)
        const target = getCurrentUser(targetClientId)
        // mesajı kaydeder
        // kullanıcıya message gonderir
        //  hedeflenen client mesajı alır
        if(type === "text") {
           // İki kullanıcı için mesaj ekle
 // Bir istemci mesaj gönderir ve diğer taraf mesaj alır
            addMessageInfo(MessageInfo(user.username, target.username, msg, "sended", type, 0))
            addMessageInfo(MessageInfo(target.username, user.username, msg, "received", type, 0))
        } else {    // file
            let fileID = addFile(msg) // Storage file
            // İki taraf için dosya mesajı ekle
            addMessageInfo(MessageInfo(user.username, target.username, msg.filename, "sended", type, fileID))
            addMessageInfo(MessageInfo(target.username, user.username, msg.filename, "received", type, fileID))
            //  diğer istemciye gönder
            io.to(targetClientId).emit("messages", {
                messages: getMessages(targetClientId)
            })

            //  kendi istemcine gönder
            io.to(user.id).emit("messages", {
                messages: getMessages(targetClientId)
            })
        }
        
        // Tüm mesajları hedef müşteriye gönder
        io.to(targetClientId).emit("messages", {
            messages: getMessages(targetClientId)
        })
    })

    // mesajları dinle
    socket.on("messages", (id) => {
        //  client gonder
        io.to(socket.id).emit("messages", {
            messages: getMessages(id)
        })
    })

    // yeni room icin dinle
    socket.on("newRoom", roomname => {
        addRoom(roomname)   // yeni odayı servera ekle
     // Oda bilgilerini tüm müşterilere gönder
        io.emit("newRoom", {
            rooms: allRooms()
        })
    })

    // join odasını dinle
    socket.on("joinRoom", selectedRoomName => {
        let user = getCurrentUser(socket.id)
        let clientExist = userExistInRoom(selectedRoomName, user.username)  // Bu istemciyi odada kontrol et
        // Eğer mevcut değilse
        if (!clientExist) {
            // odaya katıl
            joinRoom(user.username, selectedRoomName)
            socket.join(selectedRoomName)
           // Sunucu katılan istemciye mesaj gönder
            addMessage(selectedRoomName, Message(botName, "Welcome " + user.username, "text"))
        }
        // Odadaki tüm mesajları odadaki istemcilere gönder
        io.to(selectedRoomName).emit("chatRoom", {
            messages: getMessagesInRoom(selectedRoomName)
        })
    })

// Sohbet odasını dinle
    socket.on("chatRoom", ({ selectedRoomName, username, msg, type }) => {
        if(type === "text")
            addMessage(selectedRoomName, MessageInfo(username, selectedRoomName, msg, "sended", type, 0))  // Odaya mesaj ekle
        else {
            let fileID = addFile(msg) // storage file
     // Dosya mesajı ekle
 // Veri değil, daha az bilgi icin
            addMessage(selectedRoomName, MessageInfo(username, selectedRoomName, msg.filename, "sended", type, fileID))
        }
      // Odadan odaya mesaj gönder
        io.to(selectedRoomName).emit("chatRoom", {
            messages: getMessagesInRoom(selectedRoomName)
        })
    })


    //getFile icin dinle
    socket.on("getFile", selectedFileID => {
       // Dosyayı hedef istemciye gönder
        let file = getFile(selectedFileID)
        console.log(file)
        io.to(socket.id).emit("getFile", {file: file.file})
    })


    //client baglntı kestiginde calıstır
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)   // serverdan client ayrımak ıcın
        if (user) {
            // online user gonderip guncelle
            io.emit("onlineUsers", {
                users: getAllUsers()
            })
        }
        console.log("disconnected: " + user.username)

        //kullanıcı yoksa hic artık  odayı sil
        if(getAllUsers().length == 0) clearRooms()
    })
})


const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
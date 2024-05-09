// Client işlemlerini yapacağım bütün kodun bilgileri burda chat.html de id olarak olusturduklarımı burda degiskene atıyorum
const roomForm = document.getElementById('room-form')
const chatForm = document.getElementById('chat-form')
const chatMessages = document.getElementById("messages")
const currentUser = document.getElementById("current-username")
const allUsers = document.getElementById("users")
const allRooms = document.getElementById("rooms")
const message = document.getElementById('msg')
const emojiPicker = document.querySelector('emoji-picker')
const emojiTable = document.getElementById('emoji-table')
const btnEmoji = document.getElementById('btn-emoji')
const btnFile = document.getElementById('btn-file')


var socket = io()

//  kullanıcı ve oda bilgisini  from URL den al
//istemci tarafından sunucuya mesaj gönderme ve sunucudan mesaj alma yeteneği sağlar.
//URL'den kullanıcı adı ve oda bilgilerini çıkarmak için kullandım. Bu ifade, URL sorgu parametrelerinianaliz eder ve bu parametreleri JavaScript nesnelerine dönüştürür. 
const { username } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// User degiskenleri
let targetClientId = 0
let targetClientName = ""
let isSelectedTargetClient = false

// Room degiskenleri
let isSelectedRoom = false
let selectedRoomName = ""
let isExistUser = false

// File degiskenleri
let isSelectedFile = false
let selectedFile

let msg = "" // Message text ierigi

console.log(username, "joined to app")  //consolda yazıyo mu dogru veriyi alıyo muyuz kontrolunu gerceklestiriyo ya da bos mu degil mi 
currentUser.innerText = username  // kullanıcı adını bien username değişkeninin HTML içindeki bir elementin içeriği olarak ayarlanması icin 

// sisteme katılm istegi icin joinapp gonderir icerigi kullanıcın adı yapar ekrana yazması icin
socket.emit('joinApp', username)

// sunucudan online users bilgilerini alip userlari gosteriyorum
socket.on('onlineUsers', ({ users }) => {
    displayUsers(users)
})

//sunucudan gelen mesaj dinler ve icerisindeki mesaji isler   
socket.on('messages', ({ messages }) => {
    console.log("messsages: ", messages) //hatayı kontrol etmek icin consola yazdırdım cıktıyı gormek icin
    if (isSelectedTargetClient) //eger bu deger dogruysa  displaymess ile mesajı arayuzumde gostercek
        displayMessages(messages)
    console.log("drawed") //hata kontlu icin yine 
    // Scrhbet
    chatMessages.scrollTop = chatMessages.scrollHeight
    //sohbet kutusunun en altına otomatik olarak kaydırma yapması icin
})

// sunucu tarafından gönderilen roomsları işleyip gosterdim.
socket.on('newRoom', ({ rooms }) => {
    displayRooms(rooms)
})

// yeni chat odasını gostermke icin  en sondaki gormek icin sctool height ayarladım
socket.on('chatRoom', ({ messages }) => {
    if (isSelectedRoom)
        displayRoomMessages(messages)
    chatMessages.scrollTop = chatMessages.scrollHeight 
})
let fileid = 0
//  fileID ile file bilgisini isler
socket.on('file', fileID => {
    console.log("fileid: " + fileID)
    fileid = fileID
    //downloadURI(file.data, file.filename)
})

// file bilgisini isleyip getirmek icin 
socket.on("getFile", ({file}) => {
    console.log("file")
    console.log(file)
    downloadURI(file.data, file.filename)
})

// DOM mesajı eklemesi icin
// kullanıcı tarafı icin kullanıp, mesajları gostercek
function displayMessage(message) {
    const div = document.createElement("div") //mesajı olusturcak kutu html yapısını icin
    if (username != message.username) { //mesaj kullanıcıya mi ait kontolu
        div.classList.add("container")
        //icerigi yazar resim tarih mesajla
        div.innerHTML = `<img src="images/avatar.png" alt="Avatar">
    <p><label class="username-chat">${message.username} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
    } else {
        div.classList.add("container")
        div.classList.add("darker")
        div.innerHTML = `<img src="images/avatar.png" alt="Avatar" class="right">
    <p><label class="username-chat">${message.username} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
    }

    if(message.type === "file") {
        div.setAttribute("id", message.id) //mesaj tipi file ise ona id atar tıklanır olması icin bu bılgiyi kullnıp gerekli islemleri yapmak icin
    }

    document.getElementById("messages").appendChild(div)

    if(message.type === "file") {
        document.getElementById(message.id).onclick = () => {
            socket.emit("getFile", message.id)
            console.log("file id: " + message.id)
         }
    }
}

// Mesajı  DOM'a ekle kısıler arası  message icin
function displayMessages(messages) {
    while (chatMessages.lastChild) chatMessages.removeChild(chatMessages.lastChild) // yeni mesaj eklemek icin gecmistekileri siler
    for (const message of messages) {
        if (!(messages.length > 0 && pairMessage(message, username, targetClientName))) continue // eger sadece  eslesmeli messages ise yapae fegilse mesaj goruntulenmez
       
        const div = document.createElement("div")
        // Show message for own or others
        if (message.state === "sended" && username == message.username) {
            div.classList.add("container")
            div.classList.add("darker")
            div.innerHTML = `<img src="images/avatar.png" alt="Avatar" class="right">
    <p><label class="username-chat">${message.username} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
        } else if (message.state === "received" && username == message.username) {
            div.classList.add("container")
            div.innerHTML = `<img src="images/avatar.png" alt="Avatar">
    <p><label class="username-chat">${message.target} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
        } else if (message.state === "sended" && username != message.username) {   //mesaj icerigi durumu uygunsa yapar
            div.classList.add("container")
            div.innerHTML = `<img src="images/avatar.png" alt="Avatar">
    <p><label class="username-chat">${message.username} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
        } else {
            div.classList.add("container")
            div.classList.add("darker")
            div.innerHTML = `<img src="images/avatar.png" alt="Avatar" class="right">
    <p><label class="username-chat">${message.target} </label><label class="time">${message.time}</label><br>
    ${message.text}</p>`
        }

        // If file type is file, add id as message id
        if(message.type === "file") {
            div.setAttribute("id", message.id)
        }

        document.getElementById("messages").appendChild(div)

        // Add click event for all file types, and request file
        if(message.type === "file") {
            document.getElementById(message.id).onclick = () => {
                socket.emit("getFile", message.id)
                console.log("file id: " + message.id)
             }
        }
    }
}

//aynı sekilde mesaj ıcın degilde kullanıcılae icin 
function displayUsers(users) {
    while (allUsers.lastChild) allUsers.removeChild(allUsers.lastChild) // sil users divibi
    for (const user of users) {
        if (currentUser.innerText == user.username) continue
        const div = document.createElement("div")
        div.classList.add("user")
        div.setAttribute("id", user.id)
        div.innerHTML = `<img src="images/avatar.png" alt="Avatar">
        <p class="username"><b>${user.username} </b></p>`

        document.getElementById("users").appendChild(div)
        // Add clicl event for selecting client
        document.getElementById(user.id).onclick = () => {
            targetClientId = user.id
            targetClientName = user.username
            isSelectedTargetClient = true
            isSelectedRoom = false
            socket.emit("messages", user.id)
            console.log("target client id: " + targetClientId + ", username: " + user.username)
        };
    }
}

// Aaynısını gereklli kosullarla rooms icin 
function displayRooms(rooms) {
    while (allRooms.lastChild) allRooms.removeChild(allRooms.lastChild) 
    for (const room of rooms) {
       
        const div = document.createElement("div")
        div.classList.add("container")
        div.setAttribute("id", room.roomname)   //  id eklıyoz  room div ve  room adı
        div.innerHTML = `<img src="images/room.png" alt="Avatar">
        <p class="username">${room.roomname}</p>`
        document.getElementById("rooms").appendChild(div)
        //Oda adını seçmek için div'e tıklama islemi eklemek icin
        document.getElementById(room.roomname).onclick = () => {
            isSelectedRoom = true
            isSelectedTargetClient = false
            selectedRoomName = room.roomname
            socket.emit("joinRoom", selectedRoomName)
            console.log("selected room: " + room.roomname)
        }
    }
}

//// Oda mesajlarını DOM'a ekleme
function displayRoomMessages(messages) {
    while (chatMessages.lastChild) chatMessages.removeChild(chatMessages.lastChild) //  div messaj temizle
    for (const message of messages) {   //dive mesajı ekle ve goster
        displayMessage(message)
    }
}

// yeni oda olustur butonı
roomForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //adı girip olustur
    const msg = e.target.elements.msg_new_room.value
    console.log("New room name:", msg) // Kontrol amacıyla console.log ekledim

    // Sunucuya mesaj göndermek icin yazdırıyom konsola
    console.log("Emitting newRoom event with message:", msg) 
    //Sunucuya mesaj gönderiyom
    socket.emit("newRoom", msg)

    // sonra yenisi icin temizliyom 
    e.target.elements.msg_new_room.value = ""
    e.target.elements.msg_new_room.focus()
})

// Message gondermek  icin 
chatForm.addEventListener('submit', (e) => {
    e.preventDefault()

    //  message text almak icin
    msg = e.target.elements.msg.value

    // mesajı servera gondermek icin
    if (isSelectedTargetClient) {
        if (isSelectedFile) {
          
            sendFile("chatMessage", selectedFile, username, targetClientId) //  file  bilgisini hedeflenen  client gondermek icin func
            isSelectedFile = false  // resetle sleected degerini
            // bunu goster
            displayMessage({
                username,
                text: msg,
                time: moment().format("h:mm a"),
                type: "file"
            })
        } else {
            // obur turlu bu mesaj textını gonder
            socket.emit("chatMessage", { msg, targetClientId, type: "text" })

            //  goster arayuzde
            displayMessage({
                username,
                text: msg,
                time: moment().format("h:mm a"),
                type: "text"
            })
        }


    } else if(isSelectedRoom){
        if (isSelectedFile) {
           
            sendFile("chatRoom", selectedFile, username, selectedRoomName)
            isSelectedFile = false
        } else {
            // mesajı selectedroom dogruysa fonder
            socket.emit("chatRoom", { selectedRoomName, username, msg, type: "text" })
        }

    }

    //yeni degerler icin temizle
    e.target.elements.msg.value = ""
    e.target.elements.msg.focus()
})

// mesaj icin emoji ekle unicode 
emojiPicker.addEventListener('emoji-click', event => {
    console.log(event.detail)
    message.value = message.value + event.detail.unicode
});

let clicked = false
emojiTable.style.display = "none"
// emoji tablosunu gostermek icin
btnEmoji.onclick = () => {
    if (clicked) {
        emojiTable.style.display = "none"
        clicked = false
    } else {
        emojiTable.style.display = "inline-block"
        clicked = true
    }
}

// dosya secımı asaması
btnFile.onclick = () => {
    let fileList
    const inputElement = document.getElementById("myFile")
    inputElement.addEventListener("change", handleFiles, false) // file secildiginde
    function handleFiles() {
        fileList = this.files // file listesi icin
        console.log("filename: ", fileList[0]) 
        selectedFile = fileList[0] // secilmis dosya bilgisini almak ıcın
        message.value = fileList[0].name
    }

    document.getElementById("myFile").click() //  file chooser goster
    isSelectedFile = true
}

// Alınan mesajların kullanıcı ve hedef istemciye ait olup olmadığını kontrol ermek iin
// Çünkü tüm mesajları alıyoruz ve bir müşteri birden fazla kişiyle mesaj gönderebilir
function pairMessage(message, username, target) {
    if ((message.username === username && message.target === target) || (message.username === target && message.target === username)) {
        return true
    }

    return false
}
//file 64 tabanda almak icijn

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// dosyayı sunucuya gondermek icin
// msg degeri  file objesi icin
// target ise client yada oda ıcın
async function sendFile(event, file, username, target) {
    toBase64(file).then(data => {
        if(event === "chatMessage")
            socket.emit(event, { msg: { username, targetid: target, data, filename: file.name, filetype: file.type }, targetClientId: target, type: "file" })
        else // chatRoom
            socket.emit(event, { selectedRoomName: target, username, msg: { username, targetid: target, data, filename: file.name, filetype: file.type }, type: "file" })
    }).catch();
}
//file dosyasını ind icin
function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}
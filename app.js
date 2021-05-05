var app = require('http').createServer(response);
var fs = require('fs');
var io = require('socket.io')(app);
// var schedule = require('node-schedule');

app.listen(3000);
console.log("App running...");

function response(req, res) {
    var file = "";
    if(req.url == "/"){
	   file = __dirname + '/index.html';
    } else {
	   file = __dirname + req.url;
    }
   
    fs.readFile(file,
	    function (err, data) {
			if (err) {
				res.writeHead(404);
				return res.end('Page or file not found');
			}

			res.writeHead(200);
			res.end(data);
	    }
    );
}

var count = 0;
var last_user = '';

io.use(function(socket, next){
    console.log("Query: ", socket.handshake.query);
    // return the result of next() to accept the connection.
    last_user = socket.handshake.query.user;
    return next();
});

io.on("connection", function(socket){
		count++;
		var user_nick = last_user;
		// io.sockets.emit("update messages", "Witamy Talkinn!");

		socket.on("join", function(nick) {
			io.sockets.emit("update messages", {msg: nick + gender(nick, " dołączył", " dołączyła") + " do rozmowy.", type: 'info'});
			socket.emit("update messages", {msg: "Aktualnie na czacie " + format(count, "jesteś ", "są ", "jest ") + format(count, "tylko", count, count) + format(count, " Ty", " osoby", " osób") + ".", type: 'info'});
			// if(user_nick == '') user_nick = nick;
		});

		socket.on("nick change", function(nick) {
			last_user = nick.new;
			user_nick = nick.new;
			io.sockets.emit("update messages", {msg: nick.old + gender(nick.old, " zmienił", " zmieniła") + " swój nick na: " + nick.new + ".", type: 'info'});
		});

		socket.on("emoji", function(emoji) {
			io.sockets.emit("update messages", {msg: user_nick, type: 'nick'}, user_nick);
			io.sockets.emit("update messages", {msg: emoji, type: 'emoji'}, user_nick);
		});

		socket.on("custom message", function(message) {
			io.sockets.emit("update messages", {msg: message, type: 'info'});
		});

    socket.on("send message", function(data, callback){
		if(data.message.toLowerCase() == '/kostka') {
			sent_msg = data.nick + gender(data.nick, " rzucił", " rzuciła") + " kostką...";
			dices = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
			io.sockets.emit("update messages", {msg: sent_msg, type: 'info'});
			setTimeout(function() {
				// io.sockets.emit("update messages", {msg: user_nick, type: 'nick', attr: 'center'});
				io.sockets.emit("update messages", {msg: dices[rand(0, 5)], type: 'emoji', attr: 'center'});
			}, 2000);
				callback();
			} else if(data.message == '/users') {
				socket.emit("update messages", {msg: "Aktualnie zalogowani: Ty i " + (count - 1) + " " + format(count - 1, "inna osoba", "inne osoby", "innych osób") + ".", type: 'info'});
				callback();
			} else if(data.message == '/info') {
				socket.emit("update messages", {msg: "Talkinn Web Edition to prototyp wersji przeglądarkowej działającego niegdyś czatu GG Talkinn (wcześniej CzatPS 2). Aplikacja może być też wykorzystana w formie komunikatora - swego rodzaju klienta dla czatów GG. W obecnej formie jest to tylko czat pomiędzy użytkownikami, którzy w danej chwili otworzyli stronę. Przesyłane wiadomości nie są w żaden sposób zapisywane. Są one jedynie przesyłane pomiędzy aktualnie zalogowanych (dosłownie: patrzących na okienko z czatem) uczestników rozmowy. Po zamknięciu karty/okna przegladarki - tracimy dostęp do wiadomości. Wszelkie prawa niezastrzeżone 🤔", type: 'info'});
				callback();
			} else if(data.message[0] == '/') {
				socket.emit("update messages", {msg: "Wpisana komenda jest nieprawidłowa.", type: 'info', color: '#ff7575'});
				callback();
			} else {
			sent_msg = data.message;
			if(sent_msg.length) {
			io.sockets.emit("update messages", {msg: user_nick, type: 'nick'}, user_nick);
			io.sockets.emit("update messages", sent_msg, user_nick);
			callback();
		} 
		}
    });

		socket.on('disconnect', function () {
			count--;
			if(user_nick) io.sockets.emit("update messages", {msg: user_nick + gender(user_nick, " opuścił", " opuściła") + " czat.", type: 'info'});
		});
});

function format(num, first, second, third) {
	num = Math.abs(num);
	if(num == 1) return first;
	if(num % 100 >= 10 && num % 100 <= 19) return third;
	if(num % 10 >= 2 && num % 10 <= 4) return second;

	return third;
} 

function gender(nick, first, second) {
	return (nick.slice(-1) == 'a' ? second : first);
} 

function getCurrentDate(){
	var currentDate = new Date();
	var day = (currentDate.getDate()<10 ? '0' : '') + currentDate.getDate();
	var month = ((currentDate.getMonth() + 1)<10 ? '0' : '') + (currentDate.getMonth() + 1);
	var year = currentDate.getFullYear();
	var hour = (currentDate.getHours()<10 ? '0' : '') + currentDate.getHours();
	var minute = (currentDate.getMinutes()<10 ? '0' : '') + currentDate.getMinutes();
	var second = (currentDate.getSeconds()<10 ? '0' : '') + currentDate.getSeconds();

	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.round(Math.random() * (max - min)) + min;
}
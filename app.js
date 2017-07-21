const express = require('express');
const bodyParser = require('body-parser');
const mustache = require('mustache-express');
const expressValidator = require('express-validator');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');


const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

let app = express();

const startModel = {
  counter: 8
};

app.use(session({
  secret: 'original and not copied',
  resave: false,
  saveUninitialized: true
}))

app.engine('mustache', mustache());

app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static('public'));
app.use(bodyParser.urlencoded());
app.use(expressValidator());

app.get('/', (request, response) => {
  var chosenWord = '';
  function wordLength(){
    if(chosenWord.length > 7) {
      wordGenerator();
    }
  }
  function wordGenerator() {
    chosenWord = words[Math.floor(Math.random() * words.length)];
    wordLength();
  }

  wordGenerator();
  var spaces = [];
  var whiteSpace = [];
  for (i = 0; i < chosenWord.length; i++){
    spaces.push(' __ ');
    whiteSpace.push(' ');
  }
  session.guessesLeft = 8;
  session.word = chosenWord;
  session.spaces = spaces;
  session.whiteSpace = whiteSpace;
  session.guessedLetters = [];
  console.log(session.spaces);
  console.log(session.word);
  console.log(session.guessesLeft);
  response.render('index', startModel);

})

app.post('/', (request, response) => {
  var userGuess = (request.body.guess);
  var correct = false;
  session.guessedLetters.push(userGuess);
  for(i = 0; i < session.word.length; i++){
    if(userGuess == session.word[i]){
      session.spaces[i] = userGuess;
      correct = true;
    }
  }
  if(!correct){
    session.guessesLeft = session.guessesLeft - 1;
  }
  console.log(session.spaces);
  console.log(session.guessedLetters);
  console.log(session.guessesLeft);

  var model = {
    spaces: session.spaces,
    whiteSpace: session.whiteSpace,
    guessed: session.guessedLetters,
    counter: session.guessesLeft,
    word: session.word
  };
  session.model = model;
  console.log(model);

  if(session.guessesLeft > 0){
    response.render('index', model);
  }
  else {
    response.render('index', model);
  }

})

app.post('/', (request, response) => {
  response.redirect('/');
  resquest.session = null;
})

app.listen(4000, function () {
  console.log('lets drive');
})

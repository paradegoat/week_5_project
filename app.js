
'use strict';
const express = require('express');
const expressValidator = require('express-validator');
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sessionConfig = require("./sessionConfig");
const fs = require('file-system');
const app = express();
const port = process.env.port || 3000;
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");


app.engine("mustache", mustacheExpress());

app.set("views", "./views");
app.set("view engine", "mustache");

app.use("/", express.static("./views"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(session(sessionConfig));
app.use(expressValidator());

app.use(function (req, res, next) {
  var game = req.session.game;
  if (!game) {
    game = req.session.game = {};
    game.mode = '';
    game.guessesLeft = 8;
    game.lettersGuessed = [];
    game.textBtn = 'Play game';
    game.status = '';
    game.lose = false;
    game.playing = false;
    game.message = '';
    game.display = '';
  }
  next();
});


app.get('/', function(req, res) {
  if (req.session.game.playing || req.session.game.textBtn != 'Play game') {
    req.session.game.display = buildDisplay(req.session.game);
  }
  res.render('index', { game: req.session.game });
});

app.post('/', function(req, res) {
  var game = req.session.game;
  if (game.playing) {
    req.checkBody("guessLetter", "You must enter a letter!").notEmpty().isAlpha();
    var errors = req.validationErrors();
    console.log('ERRORS =', errors);
    if (errors) {
      game.message = errors[0].msg;
    } else {
      console.log('lettersGuessed ',game.lettersGuessed);
      if (game.lettersGuessed.indexOf(req.body.guessLetter.toUpperCase()) > -1) {
        game.message = 'You already guessed letter ' + req.body.guessLetter.toUpperCase();;
      } else {
        var n = game.word.indexOf(req.body.guessLetter.toUpperCase());
        if (n == -1) {
          game.message = 'Bad guess...try again!';
          game.guessesLeft -= 1;
          game.lettersGuessed.push(req.body.guessLetter.toUpperCase());
          if (game.guessesLeft == 0) {
            game.message = '';
            game.textBtn = 'Try again';
            game.status = 'You lose!';
            game.playing = false;
            game.lose = true;
          }
        } else {
          game.lettersGuessed.push(req.body.guessLetter.toUpperCase());
          game.message = '';
          req.session.game.display = buildDisplay(req.session.game);
          if (game.display.indexOf(' ') ==  -1) {
            game.message = '';
            game.textBtn = 'Try again';
            game.status = 'You win!';
            game.playing = false;
            game.lose = false;
          }
        }
      }
    }
  } else {
    game.playing = true;
    game.textBtn = "Make a guess";
    game.mode = req.body.mode;
    game.word = findRandomWord(game.mode);
    game.lose = false;
    game.guessesLeft = 8;
    game.lettersGuessed = [];
  }

  console.log("you are watching", req.session);
  res.redirect('/');
});


app.listen(port, function() {
  console.log('please work this time');
});

function buildDisplay(game) {
  var showText = [];
  for (let i = 0; i < game.word.length; i++) {
    if (game.lettersGuessed.indexOf(game.word[i]) > -1) {
       showText.push(game.word[i].toUpperCase());
     } else {
       if (game.lose == true) {
          showText.push(game.word[i].toUpperCase());
       } else {
          showText.push(' ');
       }
     }
  }
  return showText;
};

function findRandomWord(mode) {
  let randomWord;
  let wordLength = 0;
  let getWord = false;

  while (!getWord) {
    let randomNumber = Math.floor((Math.random() * words.length-1) + 1)
    randomWord = words[randomNumber];
    wordLength = randomWord.length;
    switch(mode) {
      case'':
          if (wordLength <= 7) {getWord = true;}
          break;
      default:
          getWord = true;
          break;
    }
  }

  return randomWord.toUpperCase();
};

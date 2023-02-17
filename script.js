const buttons = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];
const frequencies = [
  [697, 770, 852, 941],
  [1209, 1336, 1477, 1633],
];

const title = document.getElementById("title");
const timer = document.getElementById("timer");

let osc1, osc2, stopTime;
const stopTone = () => {
  const timeout = Math.max(0, stopTime - Date.now()) / 1000;
  if (osc1) {
    osc1.stop(timeout);
    osc1 = null;
  }
  if (osc2) {
    osc2.stop(timeout);
    osc2 = null;
  }
};
const playTone = (row, col) => {
  stopTone();

  const ctx = new AudioContext();
  const wave = ctx.createPeriodicWave([0, 1], [0, 0]);
  const gain = ctx.createGain();
  gain.gain.value = 0.1;
  gain.connect(ctx.destination);
  const merger = ctx.createChannelMerger(2);
  merger.connect(gain);

  osc1 = ctx.createOscillator();
  osc1.setPeriodicWave(wave);
  osc1.frequency.value = frequencies[0][row];
  osc1.connect(merger, 0, 0);

  osc2 = ctx.createOscillator();
  osc2.setPeriodicWave(wave);
  osc2.frequency.value = frequencies[1][col];
  osc2.connect(merger, 0, 1);

  osc1.start();
  osc2.start();
  stopTime = Date.now() + 250;
};

let voice;
const speak = txt => {
  if (!voice) {
    const voices = speechSynthesis.getVoices();
    voice = voices.find(v => v.lang == 'fr-CA') || voices.find(v => v.lang == 'fr');
  }
  const u = new SpeechSynthesisUtterance(txt);
  u.voice = voice;
  speechSynthesis.speak(u);
}

let titleText = "";
let step = 0;
let mode = 0;
let val1 = "", val2 = "";
let debounce = false;

const ringtone = document.getElementById("ringtone")
document.getElementById("accept").addEventListener("click", () => {
  ringtone.pause();
  document.getElementById("incoming").classList.add("hidden");
  document.getElementById("keypad").classList.remove("hidden");

  timer.textContent = "00:00"
  let t = 0;
  setInterval(() => {
    t++;
    timer.textContent = twoDigits(Math.floor(t / 60)) + ":" + twoDigits(t % 60);
  }, 1000);

  speak("Bienvenue chez pythagore. Si vous connaissez la longueur des deux cathètes, composez le 1. Si vous connaissez la longueur de l'hypothénuse et d'une cathète, composez le 2.")
})

const terminate = () => {
  stopTone();
  ringtone.remove();
  speechSynthesis.cancel();
  document.getElementById("container").classList.add("hidden");

  const ctx = new AudioContext();
  const wave = ctx.createPeriodicWave([0, 1], [0, 0]);
  const gain = ctx.createGain();
  gain.gain.value = 0.1;
  const osc = ctx.createOscillator();
  osc.setPeriodicWave(wave);
  osc.frequency.value = 425;
  osc.connect(gain);
  osc.start();

  gain.connect(ctx.destination);
  sleep(300)()
    .then(() => gain.disconnect())
    .then(sleep(150))
    .then(() => gain.connect(ctx.destination))
    .then(sleep(300))
    .then(() => gain.disconnect())
    .then(sleep(150))
    .then(() => gain.connect(ctx.destination))
    .then(sleep(300))
    .then(() => gain.disconnect())
}

document.getElementById("decline").addEventListener("click", () => terminate());
document.getElementById("hangup").addEventListener("click", () => terminate());
const ev = () => {
  ringtone.play();
  document.removeEventListener("click", ev);
}
document.addEventListener('click', ev);

const waiting = [];
const sleep = t => () => new Promise(resolve => setTimeout(resolve, t));

for (let row = 0; row < buttons.length; row++) {
  for (let col = 0; col < buttons[row].length; col++) {
    const button = document.getElementById(buttons[row][col]);
    const mouseUp = () => new Promise((resolve) => waiting.push({button: button.id, resolve}));
    const onMouseDown = () => {
      speechSynthesis.cancel();
      playTone(row, col);
      titleText += buttons[row][col];
      title.textContent = titleText.split('*').reverse().join('*');
      
      if (debounce) return;
      if (step == 0) {
        debounce = true;
        mouseUp().then(sleep(1000)).then(() => {
          debounce = false;
          switch (button.id) {
            case '1':
              step = 1;
              mode = 1;
              titleText = "";
              speak("Composez la longueur de la première cathète, suivi du carré. Pour insérer une virgule, faites l'étoile.");
              break;
            case '2':
              step = 1;
              mode = 2;
              speak("Composez la longueur de l'hypoténuse, suivi du carré. Pour insérer une virgule, faites l'étoile.");
              break;
            default:
              speak("Option invalide. Si vous connaissez la longueur des deux cathètes, composez le 1. Si vous connaissez la longueur de l'hypothénuse et d'une cathète, composez le 2.");
              break;
          }
        })
      } else if (step == 1) {
        if (button.id == '#') {
          debounce = true;
          mouseUp().then(sleep(1000)).then(() => {
            debounce = false;
            titleText = "";
            val1 = +val1;
            if (isNaN(val1)) {
              speak("Nombre invalide. Composez la longueur de "+(mode == 1 ? "la première cathète" : "l'hypothénuse")+", suivi du carré. Pour insérer une virgule, faites l'étoile.")
              val1="";
            } else {
              step = 2;
              speak("Composez la longueur de " + (mode == 1 ? "la deuxième cathète" : "la cathète") + " suivie du carré. Pour insérer une virgule, faites l'étoile.");
            }
          })
        } else if (button.id == '*') {
          val1 += '.';
        } else {
          val1 += button.id;
        }
      } else if (step == 2) {
        if (button.id == '#') {
          debounce = true;
          mouseUp().then(sleep(1000)).then(() => {
            debounce = false;
            val2 = +val2;
            if (isNaN(val2)) {
              speak("Nombre invalide. Composez la longueur de "+(mode == 1 ? "la deuxième cathète" : "la cathète")+", suivi du carré. Pour insérer une virgule, faites l'étoile.")
              val2="";
            } else {
              step = 3;
              if (mode == 1) {
                const r = Math.sqrt(val1**2 + val2**2).toString().replace(".", " virgule ");
                speak("La longueur de l'hypothénuse est de " + r + ". Merci d'avoir fait affaire avec Pythagore.")
              } else {
                const r = Math.sqrt(val1**2 - val2**2).toString().replace(".", " virgule ");
                speak("La longueur de l'autre cathète est de " + r + ". Merci d'avoir fait affaire avec Pythagore.")
              }
              let i = setInterval(() => {
                if (!speechSynthesis.speaking) {
                  clearInterval(i);
                  document.getElementById("container").style.display = "none";
                }
              }, 1000);
            }
          })
        } else if (button.id == '*') {
          val2 += '.';
        } else {
          val2 += button.id;
        }
      }

    };
    const onMouseUp = () => {
      stopTone();
      for (let i = 0; i < waiting.length; i++) {
        if (waiting[i].button == button.id) {
          waiting[i].resolve();
          waiting.splice(i, 1);
          i--;
        }
      }
    };
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      onMouseDown();
    });
    button.addEventListener("mousedown", () => onMouseDown());
    button.addEventListener("touchend", () => onMouseUp());
    button.addEventListener("mouseup", () => onMouseUp());
  }
}

const twoDigits = (n) => {
  if (n == 0) {
    return "00";
  } else if (n < 10) {
    return "0" + n;
  } else {
    return n.toString();
  }
};

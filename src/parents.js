// Eltern-Bereich: Name und Foto der Spielfigur. Er liegt als normale
// Webseite (HTML) über dem Spiel, weil man hier tippen und die Kamera
// benutzen muss. Davor steht die Eltern-Sperre: eine Rechenaufgabe.
// Name und Foto werden nur im Spielstand auf diesem Gerät gespeichert.

const NAME_LENGTH = 20;
const PHOTO_SIZE = 192; // das Foto wird quadratisch auf diese Pixelgröße verkleinert

const STYLE = `
.eltern { position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;
  background: rgba(29, 59, 20, 0.6); font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
  -webkit-user-select: text; user-select: text; touch-action: manipulation; }
.eltern-box { background: #fff6e0; border: 3px solid #d9b77a; border-radius: 28px; padding: 28px 32px;
  width: min(440px, calc(100vw - 48px)); box-sizing: border-box; color: #4a3417; text-align: center; }
.eltern h2 { margin: 0 0 16px; font-size: 24px; }
.eltern p { margin: 0 0 16px; font-size: 17px; line-height: 1.4; }
.eltern-reihe { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin: 12px 0; }
.eltern button { font: inherit; font-size: 18px; font-weight: 600; border: none; border-radius: 16px;
  padding: 14px 20px; min-width: 64px; min-height: 56px; background: #ffd84a; color: #4a3417; }
.eltern button.leise { background: #eadfc6; }
.eltern button.gruen { background: #6cc04a; color: #fff; }
.eltern input[type=text] { font: inherit; font-size: 20px; width: 100%; box-sizing: border-box; padding: 12px 14px;
  border: 2px solid #d9b77a; border-radius: 14px; background: #fff; }
.eltern label { display: block; text-align: left; font-weight: 600; margin: 18px 0 6px; }
.eltern-foto { width: 120px; height: 120px; border-radius: 50%; background: #eadfc6 center / cover no-repeat;
  margin: 8px auto; border: 3px solid #d9b77a; }
.eltern-hinweis { font-size: 14px; color: #7a5a2a; margin-top: 4px; }
`;

function addStyle() {
  if (document.getElementById('eltern-style')) return;
  const style = document.createElement('style');
  style.id = 'eltern-style';
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function overlay(html) {
  addStyle();
  const element = document.createElement('div');
  element.className = 'eltern';
  element.innerHTML = `<div class="eltern-box">${html}</div>`;
  document.body.appendChild(element);
  return element;
}

// Eltern-Sperre: eine Plus-Aufgabe mit drei Antworten.
// Falsche Antwort: einfach eine neue Aufgabe, keine Strafe.
export function askParentLock(onSuccess, onCancel) {
  const element = overlay('');
  const box = element.firstChild;

  const showTask = () => {
    const a = 11 + Math.floor(Math.random() * 9);
    const b = 4 + Math.floor(Math.random() * 6);
    const answer = a + b;
    const answers = [answer, answer + 1 + Math.floor(Math.random() * 3), answer - 1 - Math.floor(Math.random() * 3)];
    answers.sort(() => Math.random() - 0.5);
    box.innerHTML = `
      <h2>Für Erwachsene</h2>
      <p>Wie viel ist ${a} + ${b}?</p>
      <div class="eltern-reihe">${answers.map((n) => `<button data-zahl="${n}">${n}</button>`).join('')}</div>
      <div class="eltern-reihe"><button class="leise" data-abbrechen>Zurück zum Spiel</button></div>`;
    box.querySelectorAll('[data-zahl]').forEach((button) =>
      button.addEventListener('click', () => {
        if (Number(button.dataset.zahl) === answer) {
          element.remove();
          onSuccess();
        } else {
          showTask();
        }
      })
    );
    box.querySelector('[data-abbrechen]').addEventListener('click', () => {
      element.remove();
      onCancel?.();
    });
  };
  showTask();
}

// Name und Foto bearbeiten. onSave({ name, photo }) beim Speichern.
export function openParentArea(profile, onSave, onCancel) {
  let photo = profile.photo || null;
  const element = overlay(`
    <h2>Eltern-Bereich</h2>
    <label for="eltern-name">Name der Spielfigur</label>
    <input type="text" id="eltern-name" maxlength="${NAME_LENGTH}" autocomplete="off" autocorrect="off">
    <div class="eltern-hinweis">Die Tiere sagen den Namen, z. B. beim Einziehen.</div>
    <label>Foto vom Gesicht</label>
    <div class="eltern-foto"></div>
    <div class="eltern-reihe">
      <button data-foto>Foto aufnehmen</button>
      <button class="leise" data-foto-weg>Foto entfernen</button>
    </div>
    <div class="eltern-hinweis">Gesicht möglichst groß in die Mitte. Das Foto ersetzt den Kopf der Figur.</div>
    <input type="file" accept="image/*" hidden>
    <div class="eltern-reihe" style="margin-top: 24px">
      <button class="leise" data-abbrechen>Abbrechen</button>
      <button class="gruen" data-speichern>Speichern</button>
    </div>
    <div class="eltern-hinweis">Name und Foto bleiben nur auf diesem iPad.</div>`);

  const nameInput = element.querySelector('#eltern-name');
  const preview = element.querySelector('.eltern-foto');
  const fileInput = element.querySelector('input[type=file]');
  const removeButton = element.querySelector('[data-foto-weg]');
  nameInput.value = profile.name || '';

  const showPhoto = () => {
    preview.style.backgroundImage = photo ? `url("${photo}")` : '';
    removeButton.hidden = !photo;
  };
  showPhoto();

  element.querySelector('[data-foto]').addEventListener('click', () => fileInput.click());
  removeButton.addEventListener('click', () => {
    photo = null;
    showPhoto();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    const result = await shrinkPhoto(file);
    if (result) {
      photo = result;
      showPhoto();
    }
  });
  element.querySelector('[data-abbrechen]').addEventListener('click', () => {
    element.remove();
    onCancel?.();
  });
  element.querySelector('[data-speichern]').addEventListener('click', () => {
    element.remove();
    onSave({ name: cleanName(nameInput.value), photo });
  });
}

export function cleanName(name) {
  return String(name || '')
    .replace(/[^\p{L}\p{N} \-']/gu, '')
    .trim()
    .slice(0, NAME_LENGTH);
}

// Foto quadratisch aus der Mitte ausschneiden und klein rechnen (spart Speicher)
function shrinkPhoto(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      canvas
        .getContext('2d')
        .drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    image.src = url;
  });
}

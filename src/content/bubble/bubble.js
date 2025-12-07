let bubble = null;
let bubbleTimeout = null;

let messageEl = null;
let pupils = [];


// move iris based on gaze coordinates
export function updateBubbleEyeDirection(x, y) {
  if (!bubble || pupils.length === 0) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const nx = (x / vw - 0.5) * 2;
  const ny = (y / vh - 0.5) * 2;

  const MAX_X = 6;
  const MAX_Y = 4;

  const offsetX = Math.max(-MAX_X, Math.min(MAX_X, nx * MAX_X));
  const offsetY = Math.max(-MAX_Y, Math.min(MAX_Y, ny * MAX_Y));

  pupils.forEach(p => {
    p.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
}

// floating UI bubble 
function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  Object.assign(bubble.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "170px",
    minHeight: "70px",
    zIndex: "2147483647",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: "6px",
    borderRadius: "20px",
    background: "linear-gradient(145deg, rgba(240,255,245,0.85), rgba(205,235,225,0.65))",
    backdropFilter: "blur(10px)",
    boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
    transition: "background 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease"
  });

  const eyesWrapper = document.createElement("div");
  Object.assign(eyesWrapper.style, {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "4px"
  });

  function makeEye() {
    const eye = document.createElement("div");
    Object.assign(eye.style, {
      width: "34px",
      height: "40px",
      borderRadius: "50%",
      background: "white",
      border: "3px solid #777",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative"
    });

    const iris = document.createElement("div");
    Object.assign(iris.style, {
      width: "20px",
      height: "28px",
      borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, #7a5527, #3e260f 65%)",
      position: "absolute",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "transform 0.07s linear"
    });

    const pupil = document.createElement("div");
    Object.assign(pupil.style, {
      width: "10px",
      height: "14px",
      borderRadius: "50%",
      background: "#000"
    });

    const shine = document.createElement("div");
    Object.assign(shine.style, {
      width: "6px",
      height: "6px",
      borderRadius: "50%",
      background: "white",
      opacity: "0.8",
      position: "absolute",
      top: "4px",
      left: "5px"
    });

    iris.appendChild(pupil);
    iris.appendChild(shine);
    eye.appendChild(iris);

    pupils.push(iris);
    return eye;
  }

  eyesWrapper.appendChild(makeEye());
  eyesWrapper.appendChild(makeEye());

  messageEl = document.createElement("div");
  Object.assign(messageEl.style, {
    minHeight: "18px",
    maxWidth: "150px",
    fontSize: "11px",
    lineHeight: "1.25",
    color: "#0b3b2f",
    textAlign: "center",
    padding: "4px 6px",
    opacity: "0",
    transition: "opacity 0.25s ease",
    marginTop: "3px",
    marginBottom: "4px"
  });

  bubble.appendChild(eyesWrapper);
  bubble.appendChild(messageEl);
  document.body.appendChild(bubble);
}

// state handler: NORMAL or WARNING
export function showBubbleState(type = "NORMAL", message = "") {
  createBubble();

  if (bubbleTimeout) {
    clearTimeout(bubbleTimeout);
    bubbleTimeout = null;
  }

  if (type === "NORMAL" || !message) {
    bubble.style.background =
      "linear-gradient(145deg, rgba(240,255,245,0.85), rgba(205,235,225,0.65))";

    messageEl.style.opacity = "0";
    messageEl.textContent = "";
    return;
  }

  bubble.style.background = "rgba(255,205,205,0.75)";
  messageEl.textContent = message;
  messageEl.style.opacity = "1";

  // auto revert to NORMAL after 12 seconds 
  bubbleTimeout = setTimeout(() => {
    showBubbleState("NORMAL", "");
  }, 12000);
}

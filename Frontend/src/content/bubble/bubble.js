// handle bubble state 
let bubble = null;
let bubbleTimeout = null;

let messageEl = null;
let pupils = [];

// drag bubble-ui state
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// blink & movement transform tracking
let eyeOffsetX = 0;
let eyeOffsetY = 0;
let blinkScaleY = 1;
let blinkInterval = null;

// arrow return button
let returnButton = null;

// track alert mode
let bubbleAlertActive = false;

// move iris based on gaze coordinates
export function updateBubbleEyeDirection(x, y) {
  if (!bubble || pupils.length === 0) return;

  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;

  const nx = (x / vw - 0.5) * 2;
  const ny = (y / vh - 0.5) * 2;

  const MAX_X = 6;
  const MAX_Y = 4;

  eyeOffsetX = Math.max(-MAX_X, Math.min(MAX_X, nx * MAX_X));
  eyeOffsetY = Math.max(-MAX_Y, Math.min(MAX_Y, ny * MAX_Y));

  applyPupilTransform();
}

// helper: merge gaze + blink transform
function applyPupilTransform() {
  const t = `translate(${eyeOffsetX}px, ${eyeOffsetY}px) scaleY(${blinkScaleY})`;
  pupils.forEach(p => { p.style.transform = t; });
}

// floating UI bubble 
function createBubble() {
  if (bubble) return;

  bubble = document.createElement("div");
  Object.assign(bubble.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "260px",
    minHeight: "130px",
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
    transition: "background 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease, opacity 0.25s ease",
    cursor: "grab"
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
    minHeight: "28px",
    maxWidth: "220px",
    fontSize: "16px",
    fontWeight: "500",
    lineHeight: "1.35",
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

  // dashboard button
  const dashBtn = document.createElement("button");
  Object.assign(dashBtn.style, {
    marginTop: "4px",
    fontSize: "13px",
    padding: "4px 10px",
    borderRadius: "10px",
    border: "1px solid #0b3b2f",
    background: "#ffffffd9",
    cursor: "pointer",
    color: "#0b3b2f",
    fontWeight: "600",
    transition: "background 0.2s ease, color 0.2s ease"
  });
  dashBtn.textContent = "📊 Dashboard";
  dashBtn.style.fontWeight = "600";
  dashBtn.style.fontSize = "13px";
  
  // click to open dashboard
  dashBtn.onclick = () => {
    chrome.runtime.sendMessage({
      type: "OPEN_DASHBOARD"
    });
  };
  // dashBtn.onclick = () => {
  //   const dashUrl = chrome.runtime.getURL("pages/dashboard/dashboard.html");
  //   chrome.tabs.query({}, tabs => {
  //     const existing = tabs.find(t => t.url && t.url.includes("pages/dashboard/dashboard.html"));
  //     if (existing) {
  //       chrome.tabs.update(existing.id, { active: true });
  //     } else {
  //       chrome.tabs.create({ url: dashUrl });
  //     }
  //   });
  // };
  
  // hover style change
  dashBtn.onmouseover = () => {
    dashBtn.style.background = "#0b3b2f";
    dashBtn.style.color = "white";
  };
  dashBtn.onmouseout = () => {
    dashBtn.style.background = "#ffffffd9";
    dashBtn.style.color = "#0b3b2f";
  };
  
  bubble.appendChild(dashBtn);
  document.body.appendChild(bubble);

  applyPupilTransform();

  enableDragging(); 
  startBlinkAnimation();  
}

// enable dragging behaviour
function enableDragging() {
  bubble.addEventListener("mousedown", (e) => {
    dragging = true;
    const rect = bubble.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    bubble.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    bubble.style.left = `${newX}px`;
    bubble.style.top = `${newY}px`;
    bubble.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    bubble.style.cursor = "grab";
    snapBubbleToNearestEdge();
  });
}

// snap & hide logic
function snapBubbleToNearestEdge() {
  const rect = bubble.getBoundingClientRect();

  // near right edge = hide right
  if (rect.left + rect.width > window.innerWidth - 40) {
    bubble.style.opacity = "0";
    bubble.style.right = "-150px";
    bubble.style.left = "auto";
    showReturnHandle("right");
    return;
  }

  // near left edge = hide left
  if (rect.left < 40) {
    bubble.style.opacity = "0";
    bubble.style.left = "-150px";
    bubble.style.right = "auto";
    showReturnHandle("left");
    return;
  }
}

// update arrow appearance based on alert mode
function updateReturnArrowStyle() {
  if (!returnButton) return;

  if (bubbleAlertActive) {
    returnButton.style.background = "#ff4d4d";  // danger red
    returnButton.style.boxShadow = "0 3px 6px rgba(255,0,0,0.4)";
  } else {
    returnButton.style.background = "#7fbfb4"; // normal mint tone
    returnButton.style.boxShadow = "0 3px 6px rgba(0,0,0,0.2)";
  }
}

// return arrow 
function showReturnHandle(side = "right") {
  if (returnButton) return;

  returnButton = document.createElement("div");
  Object.assign(returnButton.style, {
    position: "fixed",
    top: "50%",
    [side === "right" ? "right" : "left"]: "0px",
    width: "24px",
    height: "48px",
    background: "#7fbfb4",
    color: "white",
    borderRadius: side === "right" ? "8px 0 0 8px" : "0 8px 8px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: "2147483648",
    fontSize: "18px",
    fontWeight: "bold",
    boxShadow: "0 3px 6px rgba(0,0,0,0.2)",
    transition: "background 0.25s ease, box-shadow 0.25s ease"
  });

  returnButton.innerText = side === "right" ? "<" : ">";

  updateReturnArrowStyle();  // apply alert colors

  returnButton.onclick = () => {
    bubble.style.opacity = "1";
    bubble.style.top = "20px";

    if (side === "right") {
      bubble.style.right = "20px";
      bubble.style.left = "auto";
    } else {
      bubble.style.left = "20px";
      bubble.style.right = "auto";
    }

    returnButton.remove();
    returnButton = null;
  };

  document.body.appendChild(returnButton);
}

// eye blinking animation
function startBlinkAnimation() {
  if (blinkInterval) return;
  
  blinkInterval = setInterval(() => {
    blinkScaleY = 0.15;
    applyPupilTransform();
    setTimeout(() => {
      blinkScaleY = 1;
      applyPupilTransform();
    }, 120);
  }, 7000 + Math.random() * 4000);
}

// state handler: NORMAL or WARNING
export function showBubbleState(type = "NORMAL", message = "") {
  createBubble();

  if (bubbleTimeout) {
    clearTimeout(bubbleTimeout);
    bubbleTimeout = null;
  }

  if (type === "NORMAL" || !message) {
    bubbleAlertActive = false;
    bubble.style.background =
      "linear-gradient(145deg, rgba(240,255,245,0.85), rgba(205,235,225,0.65))";

    messageEl.style.opacity = "0";
    messageEl.textContent = "";
    updateReturnArrowStyle();
    return;
  }

  bubbleAlertActive = true;
  bubble.style.background = "rgba(255,205,205,0.75)";
  messageEl.textContent = message;
  messageEl.style.opacity = "1";
  updateReturnArrowStyle();

  // auto revert to NORMAL after 12 seconds 
  bubbleTimeout = setTimeout(() => {
    showBubbleState("NORMAL", "");
  }, 12000);
}

// highlight risky element on page
export function highlightElement(el) {
  if (!el) return;

  // add visual emphasis
  el.style.outline = "3px solid rgba(255, 0, 0, 0.6)";
  el.style.outlineOffset = "4px";
  el.style.transition = "outline 0.25s ease-in-out";

  // fade/gone after 8 seconds
  setTimeout(() => {
    try {
      el.style.outline = "";
    } catch (_) {}
  }, 8000);
}
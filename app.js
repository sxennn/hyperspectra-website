const state = {
  photos: [],
  slots: [null, null, null, null],
  activeSlot: 0,
  layout: "gallery",
  feedLayout: "gallery",
  preview: "paired",
  background: "#F7F5F0",
  grain: false,
  font: "editorial",
  caption: "A slower kind of Sunday.",
  timestamp: "SUNDAY, 9:41 AM · BIG SUR",
  scale: 70,
  border: 2,
  radius: 4,
  padding: 10,
  teaserMode: "cutout",
  badge: "NEW POST",
  blur: 24,
  collageBlur: 18,
  collageOpacity: 28
};

const elements = {
  fileInput: document.getElementById("fileInput"),
  dropzone: document.getElementById("dropzone"),
  photoLibrary: document.getElementById("photoLibrary"),
  slotList: document.getElementById("slotList"),
  photoCount: document.getElementById("photoCount"),
  feedCanvas: document.getElementById("feedCanvas"),
  storyCanvas: document.getElementById("storyCanvas"),
  previewStage: document.getElementById("previewStage"),
  feedPhotoMeta: document.getElementById("feedPhotoMeta"),
  storyPhotoMeta: document.getElementById("storyPhotoMeta"),
  toast: document.getElementById("toast"),
  workflowTitle: document.getElementById("workflowTitle"),
  workflowHint: document.getElementById("workflowHint"),
  teaserControls: document.getElementById("teaserControls"),
  collageControls: document.getElementById("collageControls"),
  exportPanoramaButton: document.getElementById("exportPanoramaButton")
};

const canvasContexts = {
  feed: elements.feedCanvas.getContext("2d"),
  story: elements.storyCanvas.getContext("2d")
};

const sampleArtwork = [
  {
    name: "Coastline",
    width: 1600,
    height: 1000,
    colors: ["#819188", "#d0bfa1", "#394a4b"],
    scene: '<path fill="#d2c2a7" d="M0 595 Q230 520 420 605 T850 560 T1260 560 T1600 515 V1000 H0Z"/><path fill="#71847b" d="M0 646 Q300 560 600 668 T1080 630 T1600 654 V1000 H0Z"/><path fill="#d9d3c7" d="M0 804 Q300 755 560 825 T1080 800 T1600 774 V1000 H0Z"/><path fill="#e4ddd0" opacity=".8" d="M1020 770q140-58 290 0-145 38-290 0"/>'
  },
  {
    name: "Sunday light",
    width: 1000,
    height: 1400,
    colors: ["#b8a993", "#e7d8c2", "#718174"],
    scene: '<rect x="95" y="130" width="810" height="920" rx="8" fill="#d7c7ae"/><path fill="#758477" d="M95 890 Q245 690 400 852 T690 800 T905 855 V1050 H95Z"/><circle cx="670" cy="440" r="118" fill="#f3e5c7" opacity=".83"/><path d="M120 1115h760" stroke="#958d7c" stroke-width="8" opacity=".4"/>'
  },
  {
    name: "Open road",
    width: 1400,
    height: 1400,
    colors: ["#a9a08c", "#e5d7b6", "#51635e"],
    scene: '<path fill="#63746b" d="M0 650 Q340 540 630 660 T1400 590 V1400 H0Z"/><path fill="#d8c9a9" d="M570 1400 Q650 1000 670 695 Q760 1050 900 1400Z"/><path fill="#ece0c7" d="M0 0h1400v310Q1100 250 840 340T250 325T0 370Z"/><circle cx="1110" cy="430" r="125" fill="#f5e4bd" opacity=".9"/>'
  },
  {
    name: "Moonlit bloom",
    width: 1200,
    height: 1500,
    colors: ["#9b8e88", "#ddd0c2", "#52534f"],
    scene: '<rect x="110" y="185" width="980" height="920" rx="14" fill="#d9c8b7"/><path fill="#66746b" d="M110 858 Q320 690 510 840 T820 790 T1090 830 V1105 H110Z"/><circle cx="825" cy="400" r="132" fill="#f7eddc" opacity=".86"/><path d="M160 1200h880" stroke="#84766d" stroke-width="9" opacity=".4"/>'
  }
];

let toastTimer;
let renderFrame = 0;
const grainTile = createGrainTile();

function createGrainTile() {
  const tile = document.createElement("canvas");
  tile.width = 96;
  tile.height = 96;
  const context = tile.getContext("2d");
  const data = context.createImageData(tile.width, tile.height);
  let seed = 2027;
  for (let index = 0; index < data.data.length; index += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = seed & 255;
    data.data[index] = value;
    data.data[index + 1] = value;
    data.data[index + 2] = value;
    data.data[index + 3] = 18;
  }
  context.putImageData(data, 0, 0);
  return tile;
}

function sampleImageSource(artwork) {
  const [sky, ground, accent] = artwork.colors;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${artwork.width}" height="${artwork.height}" viewBox="0 0 ${artwork.width} ${artwork.height}"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient><filter id="soft"><feGaussianBlur stdDeviation="30"/></filter></defs><rect width="100%" height="100%" fill="url(#sky)"/><circle cx="${artwork.width * 0.72}" cy="${artwork.height * 0.27}" r="${Math.min(artwork.width, artwork.height) * 0.13}" fill="#f5e8cb" opacity=".8"/><path d="M0 ${artwork.height * 0.57} Q${artwork.width * 0.22} ${artwork.height * 0.42} ${artwork.width * 0.46} ${artwork.height * 0.58} T${artwork.width} ${artwork.height * 0.51} V${artwork.height} H0Z" fill="${accent}" opacity=".72"/>${artwork.scene}<rect width="100%" height="100%" fill="#6d6151" opacity=".06"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be opened."));
    image.src = src;
  });
}

function orientationFor(width, height) {
  if (Math.abs(width - height) < 2) return "square";
  return width > height ? "landscape" : "portrait";
}

function photoDescription(photo) {
  return `${photo.orientation} · ${photo.width} × ${photo.height}`;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2600);
}

function selectedPhotos() {
  return state.slots.map((id) => state.photos.find((photo) => photo.id === id)).filter(Boolean);
}

function activeSlotCount() {
  const layout = state.layout === "teaser" ? state.feedLayout : state.layout;
  return layout === "filmstrip" ? 3 : layout === "starstrip" ? 4 : layout === "collage" ? 2 : 1;
}

function renderLibrary() {
  elements.photoCount.textContent = String(state.photos.length);
  elements.photoLibrary.replaceChildren();
  state.photos.forEach((photo) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `library-photo${state.slots[state.activeSlot] === photo.id ? " selected" : ""}`;
    button.title = `${photo.name} · ${photoDescription(photo)}. Click to place in slot ${state.activeSlot + 1}.`;
    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = "";
    const badge = document.createElement("span");
    badge.textContent = photo.orientation === "landscape" ? "LAND" : photo.orientation === "portrait" ? "VERT" : "SQUARE";
    button.append(image, badge);
    button.addEventListener("click", () => {
      state.slots[state.activeSlot] = photo.id;
      const nextEmpty = Array.from({ length: activeSlotCount() }, (_, index) => index)
        .find((index) => !state.slots[index] && index !== state.activeSlot);
      state.activeSlot = nextEmpty === undefined ? state.activeSlot : nextEmpty;
      renderInterface();
    });
    elements.photoLibrary.append(button);
  });
}

function renderSlots() {
  elements.slotList.replaceChildren();
  for (let index = 0; index < activeSlotCount(); index += 1) {
    const photo = state.photos.find((item) => item.id === state.slots[index]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot${state.activeSlot === index ? " active" : ""}`;
    button.setAttribute("aria-label", `Photo slot ${index + 1}${photo ? `, ${photo.name}` : ", empty"}`);
    const number = document.createElement("span");
    number.className = "slot-number";
    number.textContent = `0${index + 1}`;
    const name = document.createElement("span");
    name.className = `slot-name${photo ? "" : " slot-empty"}`;
    name.textContent = photo ? photo.name : "Choose a photo";
    button.append(number);
    if (photo) {
      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = "";
      button.append(image);
    }
    button.append(name);
    if (photo) {
      const remove = document.createElement("span");
      remove.className = "slot-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Clear slot");
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        state.slots[index] = null;
        state.activeSlot = index;
        renderInterface();
      });
      button.append(remove);
    }
    button.addEventListener("click", () => {
      state.activeSlot = index;
      renderInterface();
    });
    elements.slotList.append(button);
  }
}

function setHex(value, updatePicker) {
  const hex = value.replace(/^#/, "").trim();
  if (!/^[\da-fA-F]{6}$/.test(hex)) return false;
  state.background = `#${hex.toUpperCase()}`;
  if (updatePicker) document.getElementById("colorPicker").value = state.background;
  document.getElementById("hexInput").value = hex.toUpperCase();
  document.querySelectorAll(".swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.dataset.color.toUpperCase() === state.background);
  });
  renderCanvases();
  return true;
}

function renderInterface() {
  renderLibrary();
  renderSlots();
  renderCanvases();
  const slotCount = activeSlotCount();
  const filledSlots = state.slots.slice(0, slotCount)
    .filter((id) => state.photos.some((photo) => photo.id === id)).length;
  if (!state.photos.length) {
    elements.workflowTitle.textContent = "Start with a layout";
    elements.workflowHint.textContent = "Then try sample photos or add your own.";
  } else if (filledSlots < slotCount) {
    elements.workflowTitle.textContent = `Fill your photo frames (${filledSlots} of ${slotCount})`;
    elements.workflowHint.textContent = "Click a photo to fill the highlighted frame, or select a different frame first.";
  } else if (state.layout === "teaser") {
    elements.workflowTitle.textContent = "Your story teaser is ready";
    elements.workflowHint.textContent = "The Feed stays as designed; your Story gets the teaser treatment.";
  } else {
    elements.workflowTitle.textContent = "Your layout is ready";
    elements.workflowHint.textContent = "Adjust the Design Kit, then download both formats.";
  }
  const mainPhoto = selectedPhotos()[0];
  if (mainPhoto) {
    elements.feedPhotoMeta.textContent = `${mainPhoto.name} · ${photoDescription(mainPhoto)}`;
    elements.storyPhotoMeta.textContent = `${mainPhoto.name} · uncropped`;
  } else {
    elements.feedPhotoMeta.textContent = "Add a photo to begin";
    elements.storyPhotoMeta.textContent = "Synced to feed style";
  }
  elements.teaserControls.classList.toggle("visible", state.layout === "teaser");
  elements.collageControls.classList.toggle("visible",
    state.layout === "collage" || (state.layout === "teaser" && state.feedLayout === "collage"));
  elements.exportPanoramaButton.hidden = state.layout !== "panorama";
  document.querySelectorAll(".template-card").forEach((button) => {
    const active = button.dataset.layout === state.layout;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function fillBackground(context, width, height) {
  context.fillStyle = state.background;
  context.fillRect(0, 0, width, height);
  if (state.grain) {
    context.save();
    context.globalAlpha = 0.55;
    context.fillStyle = context.createPattern(grainTile, "repeat");
    context.fillRect(0, 0, width, height);
    context.restore();
  }
}

function pathRoundedRect(context, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawContain(context, image, box, radius = 0) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = box.x + (box.width - width) / 2;
  const y = box.y + (box.height - height) / 2;
  if (radius > 0) {
    pathRoundedRect(context, x, y, width, height, radius);
    context.save();
    context.clip();
    context.drawImage(image, x, y, width, height);
    context.restore();
  } else {
    context.drawImage(image, x, y, width, height);
  }
  return { x, y, width, height };
}

function drawCover(context, image, width, height) {
  if (!image || !image.naturalWidth || !image.naturalHeight) return;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function textColor() {
  const hex = state.background.slice(1);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 < 145 ? "#F5F1E9" : "#34342F";
}

function drawFrameBorder(context, rect, radius, border, background) {
  if (!rect || border <= 0) return;
  context.save();
  context.strokeStyle = background;
  context.lineWidth = border;
  pathRoundedRect(context, rect.x, rect.y, rect.width, rect.height, radius);
  context.stroke();
  context.restore();
}

function drawCaption(context, width, y, compact = false) {
  const color = textColor();
  const size = compact ? Math.round(width * 0.023) : Math.round(width * 0.032);
  context.save();
  context.textAlign = "center";
  context.fillStyle = color;
  context.font = state.font === "editorial"
    ? `${size}px "DM Serif Display", Georgia, serif`
    : `500 ${size}px "DM Sans", Arial, sans-serif`;
  context.fillText(state.caption, width / 2, y, width * 0.82);
  context.globalAlpha = 0.68;
  context.fillStyle = color;
  context.font = `500 ${Math.max(11, Math.round(size * 0.36))}px "DM Sans", Arial, sans-serif`;
  context.letterSpacing = "1px";
  context.fillText(state.timestamp, width / 2, y + size * 0.78, width * 0.85);
  context.restore();
}

function drawGallery(context, width, height, image, photo) {
  const inset = Math.min(width, height) * (state.padding / 100);
  const captionSpace = Math.max(height * 0.13, state.caption ? height * 0.15 : 0);
  const area = {
    x: inset,
    y: inset,
    width: width - inset * 2,
    height: height - inset * 2 - captionSpace
  };
  const box = {
    x: area.x + area.width * (1 - state.scale / 100) / 2,
    y: area.y + area.height * 0.08,
    width: area.width * state.scale / 100,
    height: area.height * 0.84
  };
  if (image) {
    const rect = drawContain(context, image, box, state.radius * width / 420);
    drawFrameBorder(context, rect, state.radius * width / 420, state.border * width / 420, state.background);
  } else {
    drawPlaceholder(context, width, height);
  }
  if (state.caption) drawCaption(context, width, height - inset - captionSpace * 0.46);
  if (!photo && state.caption) return;
}

function drawFilmstrip(context, width, height, photos) {
  const inset = Math.min(width, height) * (state.padding / 100);
  const gap = Math.max(4, state.border * width / 420 + width * 0.01);
  const count = Math.max(photos.length, 1);
  const cellHeight = (height - inset * 2 - gap * (count - 1)) / count;
  for (let index = 0; index < count; index += 1) {
    const photo = photos[index];
    const y = inset + index * (cellHeight + gap);
    if (photo) {
      const rect = drawContain(context, photo.image, { x: inset, y, width: width - inset * 2, height: cellHeight }, state.radius * width / 420);
      drawFrameBorder(context, rect, state.radius * width / 420, state.border * width / 420, state.background);
    } else {
      context.fillStyle = "rgba(70,70,60,.07)";
      pathRoundedRect(context, inset, y, width - inset * 2, cellHeight, state.radius * width / 420);
      context.fill();
      drawPlaceholder(context, width, height, y + cellHeight / 2);
    }
  }
}

function drawSpikyStar(context, centerX, centerY, radius, rotation, innerScale, fillStyle) {
  context.beginPath();
  for (let point = 0; point < 8; point += 1) {
    const angle = rotation + point * Math.PI / 4;
    const pointRadius = point % 2 === 0 ? radius : radius * innerScale;
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;
    if (point === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fillStyle = fillStyle;
  context.fill();
}

function drawStarfield(context, width, height) {
  let seed = 78431;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  context.fillStyle = "#141414";
  context.fillRect(0, 0, width, height);
  for (let i = 0; i < 980; i += 1) {
    const alpha = 0.08 + random() * 0.3;
    const size = 0.6 + random() * 1.5;
    context.fillStyle = `rgba(248,243,234,${alpha})`;
    context.fillRect(random() * width, random() * height, size, size);
  }
  for (let i = 0; i < 95; i += 1) {
    const x = random() * width;
    const y = random() * height;
    context.strokeStyle = `rgba(248,243,234,${0.05 + random() * 0.12})`;
    context.lineWidth = 0.7 + random() * 1.2;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + (random() - 0.5) * 16, y + 2 + random() * 10);
    context.stroke();
  }

  const stars = [
    [.81, .10, .145], [.77, .31, .095], [.84, .51, .15],
    [.91, .77, .13], [.76, .96, .14], [.04, .20, .11],
    [.02, .72, .13], [.43, .03, .10], [.55, .91, .09]
  ];
  stars.forEach(([x, y, radius], index) => {
    const centerX = x * width;
    const centerY = y * height;
    const size = radius * width;
    const rotation = (index % 2 ? Math.PI / 8 : 0) - Math.PI / 2;
    context.save();
    context.globalAlpha = 0.78;
    drawSpikyStar(context, centerX, centerY, size, rotation, 0.22, "#F8F3EA");
    drawSpikyStar(context, centerX, centerY, size * 0.72, rotation, 0.24, "#141414");
    context.globalAlpha = 0.3;
    context.strokeStyle = "#F8F3EA";
    context.lineWidth = Math.max(1, width * 0.0014);
    context.beginPath();
    context.moveTo(centerX - size * 0.1, centerY - size * 0.23);
    context.lineTo(centerX + size * 0.08, centerY + size * 0.18);
    context.moveTo(centerX + size * 0.17, centerY - size * 0.08);
    context.lineTo(centerX - size * 0.15, centerY + size * 0.12);
    context.stroke();
    context.restore();
  });
}

function drawStarstrip(context, width, height, photos) {
  drawStarfield(context, width, height);
  const stripWidth = width * 0.56;
  const stripHeight = height * 0.985;
  const outsidePadding = width * 0.022;
  const gap = Math.max(width * 0.012, height * 0.008);
  const frameWidth = stripWidth - outsidePadding * 2;
  const frameHeight = (stripHeight - outsidePadding * 2 - gap * 3) / 4;

  context.save();
  context.translate(width * 0.28, height / 2);
  context.rotate(0.035);
  context.fillStyle = state.background;
  context.fillRect(-stripWidth / 2, -stripHeight / 2, stripWidth, stripHeight);
  context.strokeStyle = "rgba(248,243,234,.5)";
  context.lineWidth = Math.max(2, state.border * width / 420);
  context.strokeRect(-stripWidth / 2, -stripHeight / 2, stripWidth, stripHeight);

  for (let index = 0; index < 4; index += 1) {
    const x = -stripWidth / 2 + outsidePadding;
    const y = -stripHeight / 2 + outsidePadding + index * (frameHeight + gap);
    const frame = { x, y, width: frameWidth, height: frameHeight };
    context.fillStyle = "#030304";
    pathRoundedRect(context, frame.x, frame.y, frame.width, frame.height, width * 0.008);
    context.fill();
    const photo = photos[index];
    if (photo) {
      const photoPadding = Math.max(2, state.border * width / 540);
      drawContain(context, photo.image, {
        x: frame.x + photoPadding,
        y: frame.y + photoPadding,
        width: frame.width - photoPadding * 2,
        height: frame.height - photoPadding * 2
      }, width * 0.004);
    }
  }
  context.restore();
}

function drawCollage(context, width, height, photos) {
  const inset = Math.min(width, height) * (state.padding / 100);
  const backdrop = photos[0];
  const foreground = photos[1] || photos[0];
  if (backdrop) {
    context.save();
    context.globalAlpha = state.collageOpacity / 100;
    context.filter = `blur(${state.collageBlur * width / 420}px)`;
    drawCover(context, backdrop.image, width + inset * 2, height + inset * 2);
    context.restore();
  } else {
    fillBackground(context, width, height);
  }
  if (!foreground) {
    drawPlaceholder(context, width, height);
    return;
  }
  const cardWidth = width * 0.66;
  const cardHeight = height * 0.55;
  const box = { x: -cardWidth / 2, y: -cardHeight / 2, width: cardWidth, height: cardHeight };
  context.save();
  context.translate(width / 2, height * 0.44);
  context.rotate(-0.035);
  context.fillStyle = state.background;
  context.fillRect(-cardWidth / 2 - 8, -cardHeight / 2 - 8, cardWidth + 16, cardHeight + 27);
  const rect = drawContain(context, foreground.image, box, state.radius * width / 420);
  drawFrameBorder(context, rect, state.radius * width / 420, state.border * width / 420, state.background);
  context.restore();
  if (state.caption) drawCaption(context, width, height * 0.86, true);
}

function drawPlaceholder(context, width, height, centerY) {
  const y = centerY || height * 0.5;
  context.save();
  context.fillStyle = textColor();
  context.globalAlpha = 0.52;
  context.textAlign = "center";
  context.font = `500 ${Math.max(12, Math.round(width * 0.022))}px "DM Sans", Arial, sans-serif`;
  context.fillText("ADD A PHOTO TO BEGIN", width / 2, y);
  context.restore();
}

function drawPanoramaSlide(context, width, height, photo, slideIndex) {
  fillBackground(context, width, height);
  if (!photo) {
    drawPlaceholder(context, width, height);
    return;
  }
  const inset = Math.min(width, height) * (state.padding / 100);
  const contentWidth = width - inset * 2;
  const contentHeight = height - inset * 2 - height * 0.06;
  const virtualWidth = contentWidth * 2;
  const scale = Math.min(virtualWidth / photo.image.naturalWidth, contentHeight / photo.image.naturalHeight);
  const imageWidth = photo.image.naturalWidth * scale;
  const imageHeight = photo.image.naturalHeight * scale;
  const x = inset + (virtualWidth - imageWidth) / 2 - slideIndex * contentWidth;
  const y = inset + (contentHeight - imageHeight) / 2;
  context.save();
  context.beginPath();
  context.rect(inset, inset, contentWidth, contentHeight);
  context.clip();
  context.drawImage(photo.image, x, y, imageWidth, imageHeight);
  context.restore();
  if (state.border > 0) {
    context.strokeStyle = state.background;
    context.lineWidth = state.border * width / 420;
    context.strokeRect(inset, inset, contentWidth, contentHeight);
  }
  context.save();
  context.fillStyle = textColor();
  context.font = `500 ${Math.round(width * 0.022)}px "DM Sans", Arial, sans-serif`;
  context.textAlign = "right";
  context.fillText(`0${slideIndex + 1}  /  02`, width - inset, height - inset * 0.32);
  if (slideIndex === 0) {
    context.setLineDash([width * 0.012, width * 0.009]);
    context.globalAlpha = 0.55;
    context.beginPath();
    context.moveTo(width - inset - 2, inset);
    context.lineTo(width - inset - 2, inset + contentHeight);
    context.strokeStyle = textColor();
    context.lineWidth = 2;
    context.stroke();
  }
  context.restore();
}

function drawTeaser(context, width, height, photos) {
  const mainPhoto = photos[0];
  if (state.teaserMode === "blur" && mainPhoto) {
    context.save();
    context.filter = `blur(${state.blur * width / 420}px)`;
    drawCover(context, mainPhoto.image, width + width * 0.22, height + height * 0.1);
    context.restore();
    context.fillStyle = state.background;
    context.globalAlpha = 0.42;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
  } else {
    fillBackground(context, width, height);
  }

  if (state.teaserMode === "continued") {
    const inset = width * (state.padding / 100);
    const box = { x: inset, y: height * 0.15, width: width - inset * 2, height: height * 0.55 };
    const rect = mainPhoto ? drawContain(context, mainPhoto.image, box, state.radius * width / 420) : null;
    drawFrameBorder(context, rect, state.radius * width / 420, state.border * width / 420, state.background);
    drawBadge(context, width, height * 0.78, "continued");
    drawCaption(context, width, height * 0.9, true);
    return;
  }

  const preview = document.createElement("canvas");
  preview.width = 1080;
  preview.height = 1350;
  const previewContext = preview.getContext("2d");
  fillBackground(previewContext, preview.width, preview.height);
  drawComposition(previewContext, preview.width, preview.height, photos, state.feedLayout);
  const card = { x: width * 0.105, y: height * 0.31, width: width * 0.79, height: height * 0.47 };
  context.save();
  context.shadowColor = "rgba(30,29,25,.22)";
  context.shadowBlur = width * 0.035;
  context.fillStyle = state.background;
  pathRoundedRect(context, card.x, card.y, card.width, card.height, state.radius * width / 420);
  context.fill();
  context.shadowColor = "transparent";
  context.clip();
  context.drawImage(preview, card.x, card.y, card.width, card.height);
  context.restore();
  context.save();
  context.strokeStyle = state.background;
  context.lineWidth = Math.max(1, state.border * width / 420);
  pathRoundedRect(context, card.x, card.y, card.width, card.height, state.radius * width / 420);
  context.stroke();
  context.restore();
  drawBadge(context, width, height * 0.23, "top");
}

function drawBadge(context, width, y, position) {
  const label = state.badge.trim() || "NEW POST";
  const fontSize = Math.round(width * 0.027);
  context.save();
  context.font = `600 ${fontSize}px "DM Sans", Arial, sans-serif`;
  const textWidth = context.measureText(label).width;
  const padX = width * 0.055;
  const badgeWidth = Math.min(width * 0.76, textWidth + padX * 2);
  const badgeHeight = width * 0.085;
  const x = (width - badgeWidth) / 2;
  context.fillStyle = textColor();
  context.globalAlpha = 0.9;
  pathRoundedRect(context, x, y - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = state.background;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label.toUpperCase(), width / 2, y, badgeWidth - padX);
  if (position === "continued") {
    context.textBaseline = "alphabetic";
    context.fillStyle = textColor();
    context.font = `500 ${Math.round(width * 0.036)}px "DM Sans", Arial, sans-serif`;
    context.fillText("Part 2 on my feed  →", width / 2, y + badgeHeight * 1.8);
  }
  context.restore();
}

function drawComposition(context, width, height, photos, layout = state.layout) {
  fillBackground(context, width, height);
  if (layout === "gallery") {
    drawGallery(context, width, height, photos[0] && photos[0].image, photos[0]);
  } else if (layout === "filmstrip") {
    drawFilmstrip(context, width, height, photos.slice(0, 3));
  } else if (layout === "starstrip") {
    drawStarstrip(context, width, height, photos.slice(0, 4));
  } else if (layout === "collage") {
    drawCollage(context, width, height, photos);
  } else if (layout === "panorama") {
    drawPanoramaSlide(context, width, height, photos[0], 0);
  } else {
    drawGallery(context, width, height, photos[0] && photos[0].image, photos[0]);
  }
}

function renderCanvases() {
  const version = ++renderFrame;
  window.requestAnimationFrame(() => {
    if (version !== renderFrame) return;
    drawCanvases();
  });
}

function drawCanvases() {
  const photos = selectedPhotos();
  const feed = canvasContexts.feed;
  const story = canvasContexts.story;
  if (state.layout === "panorama") {
    drawPanoramaSlide(feed, 1080, 1350, photos[0], 0);
    drawPanoramaStory(story, 1080, 1920, photos[0]);
  } else if (state.layout === "teaser") {
    drawComposition(feed, 1080, 1350, photos, state.feedLayout);
    drawTeaser(story, 1080, 1920, photos);
  } else {
    drawComposition(feed, 1080, 1350, photos);
    drawComposition(story, 1080, 1920, photos);
  }
}

function drawPanoramaStory(context, width, height, photo) {
  fillBackground(context, width, height);
  if (!photo) {
    drawPlaceholder(context, width, height);
    return;
  }
  const insetX = width * (state.padding / 100);
  const bandHeight = height * 0.56;
  const box = { x: insetX, y: (height - bandHeight) / 2, width: width - insetX * 2, height: bandHeight };
  const rect = drawContain(context, photo.image, box);
  drawFrameBorder(context, rect, 0, state.border * width / 420, state.background);
  context.save();
  context.fillStyle = textColor();
  context.textAlign = "center";
  context.font = `500 ${Math.round(width * 0.021)}px "DM Sans", Arial, sans-serif`;
  context.fillText("SWIPE THROUGH THE FULL VIEW", width / 2, box.y - width * 0.08);
  context.restore();
  if (state.caption) drawCaption(context, width, height - height * 0.12, true);
}

function renderAll() {
  renderInterface();
}

async function addFiles(files) {
  const accepted = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
  if (accepted.length !== files.length) showToast("Choose JPG, PNG, or WEBP photos.");
  if (!accepted.length) return;
  let added = 0;
  for (const file of accepted) {
    try {
      const src = await readFile(file);
      const image = await loadImage(src);
      const photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name.replace(/\.[^.]+$/, "") || "Untitled photo",
        src,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        orientation: orientationFor(image.naturalWidth, image.naturalHeight)
      };
      state.photos.push(photo);
      added += 1;
    } catch (error) {
      showToast(error.message || "One of those photos could not be opened.");
    }
  }
  if (added && !state.slots.some(Boolean)) state.slots[0] = state.photos[0].id;
  if (added) {
    state.activeSlot = Math.min(state.slots.findIndex((slot, index) => index < activeSlotCount() && !slot) < 0
      ? 0
      : state.slots.findIndex((slot, index) => index < activeSlotCount() && !slot), activeSlotCount() - 1);
    renderAll();
    showToast(`${added} photo${added === 1 ? "" : "s"} added to your library.`);
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadSamples() {
  state.photos = [];
  state.slots = [null, null, null, null];
  Promise.all(sampleArtwork.map(async (artwork) => {
    const src = sampleImageSource(artwork);
    const image = await loadImage(src);
    return {
      id: `sample-${artwork.name.toLowerCase().replace(/\s/g, "-")}`,
      name: artwork.name,
      src,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      orientation: orientationFor(image.naturalWidth, image.naturalHeight)
    };
  })).then((photos) => {
    state.photos = photos;
    state.slots = [0, 1, 2, 3].map((index) => photos[index] ? photos[index].id : null);
    state.activeSlot = 0;
    renderAll();
    showToast("Sample photos are ready. Choose any layout to preview them.");
  }).catch((error) => showToast(error.message || "Sample photos could not be loaded."));
}

function downloadCanvas(canvas, filename) {
  try {
    const anchor = document.createElement("a");
    anchor.download = filename;
    anchor.href = canvas.toDataURL("image/png");
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } catch (error) {
    showToast(`Could not export PNG: ${error.message}`);
  }
}

function exportCurrent(kind) {
  if (!state.photos.length) {
    showToast("Add or load a photo before exporting.");
    return;
  }
  drawCanvases();
  if (kind === "feed") {
    if (state.layout === "panorama") {
      const photos = selectedPhotos();
      [0, 1].forEach((slide) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        drawPanoramaSlide(canvas.getContext("2d"), 1080, 1350, photos[0], slide);
        downloadCanvas(canvas, `framesync-panorama-slide-${slide + 1}.png`);
      });
      showToast("Panorama feed slides exported at 1080 × 1350.");
    } else {
      downloadCanvas(elements.feedCanvas, "framesync-feed-1080x1350.png");
      showToast("Feed PNG exported at 1080 × 1350.");
    }
  } else if (kind === "story") {
    downloadCanvas(elements.storyCanvas, "framesync-story-1080x1920.png");
    showToast("Story PNG exported at 1080 × 1920.");
  } else if (state.layout === "panorama") {
    exportCurrent("feed");
    window.setTimeout(() => exportCurrent("story"), 180);
  } else {
    downloadCanvas(elements.feedCanvas, "framesync-feed-1080x1350.png");
    window.setTimeout(() => downloadCanvas(elements.storyCanvas, "framesync-story-1080x1920.png"), 180);
    showToast("Feed and story PNGs exported.");
  }
}

function setPreview(mode) {
  state.preview = mode;
  elements.previewStage.classList.remove("paired", "feed-only", "story-only");
  elements.previewStage.classList.add(mode === "paired" ? "paired" : `${mode}-only`);
  document.querySelectorAll(".preview-switch button").forEach((button) => {
    const active = button.dataset.preview === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resetDesign() {
  state.background = "#F7F5F0";
  state.grain = false;
  state.font = "editorial";
  state.caption = "A slower kind of Sunday.";
  state.timestamp = "SUNDAY, 9:41 AM · BIG SUR";
  state.scale = 70;
  state.border = 2;
  state.radius = 4;
  state.padding = 10;
  state.teaserMode = "cutout";
  state.badge = "NEW POST";
  state.blur = 24;
  state.collageBlur = 18;
  state.collageOpacity = 28;
  document.getElementById("grainToggle").checked = false;
  document.getElementById("fontSelect").value = state.font;
  document.getElementById("captionInput").value = state.caption;
  document.getElementById("timestampInput").value = state.timestamp;
  document.getElementById("scaleSlider").value = state.scale;
  document.getElementById("borderSlider").value = state.border;
  document.getElementById("radiusSlider").value = state.radius;
  document.getElementById("paddingSlider").value = state.padding;
  document.getElementById("teaserSelect").value = state.teaserMode;
  document.getElementById("badgeInput").value = state.badge;
  document.getElementById("blurSlider").value = state.blur;
  document.getElementById("collageBlurSlider").value = state.collageBlur;
  document.getElementById("collageOpacitySlider").value = state.collageOpacity;
  document.getElementById("colorPicker").value = state.background;
  setHex(state.background, true);
  updateRangeLabels();
}

function updateRangeLabels() {
  document.getElementById("scaleOutput").value = `${state.scale}%`;
  document.getElementById("borderOutput").value = `${state.border} px`;
  document.getElementById("radiusOutput").value = `${state.radius} px`;
  document.getElementById("paddingOutput").value = `${state.padding}%`;
  document.getElementById("blurOutput").value = `${state.blur} px`;
  document.getElementById("collageBlurOutput").value = `${state.collageBlur} px`;
  document.getElementById("collageOpacityOutput").value = `${state.collageOpacity}%`;
}

document.querySelectorAll(".template-card").forEach((button) => {
  button.addEventListener("click", () => {
    state.layout = button.dataset.layout;
    if (state.layout !== "teaser") state.feedLayout = state.layout;
    state.activeSlot = Math.min(state.activeSlot, activeSlotCount() - 1);
    renderAll();
  });
});

document.querySelectorAll(".preview-switch button").forEach((button) => {
  button.addEventListener("click", () => setPreview(button.dataset.preview));
});

elements.dropzone.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  event.target.value = "";
});
["dragenter", "dragover"].forEach((eventName) => {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.add("drag-over");
  });
});
["dragleave", "drop"].forEach((eventName) => {
  elements.dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropzone.classList.remove("drag-over");
  });
});
elements.dropzone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

document.getElementById("sampleButton").addEventListener("click", loadSamples);
const helpDialog = document.getElementById("helpDialog");
document.getElementById("helpButton").addEventListener("click", () => helpDialog.showModal());
document.getElementById("helpClose").addEventListener("click", () => helpDialog.close());
document.getElementById("helpDone").addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});
document.getElementById("exportButton").addEventListener("click", () => exportCurrent("both"));
document.getElementById("exportTopButton").addEventListener("click", () => exportCurrent("both"));
elements.exportPanoramaButton.addEventListener("click", () => exportCurrent("feed"));
document.querySelectorAll(".download-button").forEach((button) => {
  button.addEventListener("click", () => exportCurrent(button.dataset.export));
});

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => setHex(swatch.dataset.color, true));
});
document.getElementById("colorPicker").addEventListener("input", (event) => setHex(event.target.value, false));
document.getElementById("hexInput").addEventListener("change", (event) => {
  if (!setHex(event.target.value, true)) {
    event.target.value = state.background.slice(1);
    showToast("Enter a six-digit hex color, like F7F5F0.");
  }
});
document.getElementById("grainToggle").addEventListener("change", (event) => {
  state.grain = event.target.checked;
  renderCanvases();
});
document.getElementById("fontSelect").addEventListener("change", (event) => {
  state.font = event.target.value;
  renderCanvases();
});
document.getElementById("captionInput").addEventListener("input", (event) => {
  state.caption = event.target.value;
  renderCanvases();
});
document.getElementById("timestampInput").addEventListener("input", (event) => {
  state.timestamp = event.target.value;
  renderCanvases();
});
[
  ["scaleSlider", "scale"],
  ["borderSlider", "border"],
  ["radiusSlider", "radius"],
  ["paddingSlider", "padding"],
  ["blurSlider", "blur"],
  ["collageBlurSlider", "collageBlur"],
  ["collageOpacitySlider", "collageOpacity"]
].forEach(([id, key]) => {
  document.getElementById(id).addEventListener("input", (event) => {
    state[key] = Number(event.target.value);
    updateRangeLabels();
    renderCanvases();
  });
});
document.getElementById("teaserSelect").addEventListener("change", (event) => {
  state.teaserMode = event.target.value;
  renderCanvases();
});
document.getElementById("badgeInput").addEventListener("input", (event) => {
  state.badge = event.target.value;
  renderCanvases();
});
document.getElementById("resetButton").addEventListener("click", resetDesign);

renderInterface();
updateRangeLabels();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderCanvases);

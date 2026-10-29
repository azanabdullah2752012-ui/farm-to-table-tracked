/**
 * GreenMinds · Focused App Engine
 * Connects the Farmer App (simple entry) to the Shopper App (freshness scan)
 * Tracking the 4 Compulsory Pillars: Batch ID, Quantity, Harvested Place & Date, Freshness Level
 */

// --- 1. WEB AUDIO SYNTHESIZER ---
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq = 440, type = 'sine', duration = 0.08, gainVal = 0.08) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio context browser restrictions
    }
  }

  click() {
    this.playTone(550, 'sine', 0.04, 0.05);
  }

  scanBeep() {
    this.playTone(784, 'sine', 0.07, 0.09);
    setTimeout(() => this.playTone(1046, 'triangle', 0.1, 0.09), 70);
  }

  printSound() {
    this.playTone(480, 'square', 0.05, 0.05);
    setTimeout(() => this.playTone(620, 'square', 0.08, 0.05), 80);
  }

  alarm() {
    this.playTone(320, 'sawtooth', 0.2, 0.1);
  }

  success() {
    this.playTone(523, 'sine', 0.08, 0.08);
    setTimeout(() => this.playTone(659, 'sine', 0.08, 0.08), 80);
    setTimeout(() => this.playTone(784, 'sine', 0.15, 0.08), 160);
  }
}

const audio = new AudioEngine();

// --- 2. THE 4 COMPULSORY DATA PILLARS STORE ---
const initialBatches = [
  {
    id: "TM-8402-NSK",
    crop: "Vine Tomatoes",
    symbol: "🍅",
    quantityKg: 500.0,
    crates: 25,
    harvestPlace: "Dindori Taluka, Nashik, Maharashtra",
    harvestDate: new Date(Date.now() - 38.5 * 3600 * 1000), // 38.5 hrs ago
    freshnessPct: 94,
    grade: "A+",
    farmerName: "Ramesh Patil",
    farmerId: "MH-NSK-4091",
    farmerPrice: 24.50
  },
  {
    id: "SP-1094-OTY",
    crop: "Mountain Baby Spinach",
    symbol: "🥬",
    quantityKg: 200.0,
    crates: 20,
    harvestPlace: "Ketti Valley, Nilgiris, Tamil Nadu",
    harvestDate: new Date(Date.now() - 53.0 * 3600 * 1000), // 53 hrs ago
    freshnessPct: 78,
    grade: "A",
    farmerName: "K. Sundaram",
    farmerId: "TN-OTY-2180",
    farmerPrice: 38.00
  },
  {
    id: "BP-5531-SML",
    crop: "Crisp Bell Peppers",
    symbol: "🫑",
    quantityKg: 350.0,
    crates: 23,
    harvestPlace: "Theog, Shimla, Himachal Pradesh",
    harvestDate: new Date(Date.now() - 14.0 * 3600 * 1000), // 14 hrs ago
    freshnessPct: 91,
    grade: "A+",
    farmerName: "Vikram Thakur",
    farmerId: "HP-SML-7740",
    farmerPrice: 45.00
  }
];

let batches = JSON.parse(JSON.stringify(initialBatches));
batches.forEach((b, i) => {
  b.harvestDate = new Date(initialBatches[i].harvestDate);
});

let selectedBatchId = "TM-8402-NSK";

// --- 3. QR CODE GENERATOR ---
function renderQRCodeInto(containerEl, text) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  
  try {
    if (typeof QRCode !== 'undefined') {
      new QRCode(containerEl, {
        text: text,
        width: 104,
        height: 104,
        colorDark: "#10443e",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      return;
    }
  } catch (err) {
    console.warn("QRCode local fallback", err);
  }

  // Pure SVG Pattern Fallback
  containerEl.innerHTML = `
    <svg viewBox="0 0 100 100" class="w-full h-full">
      <rect width="100" height="100" fill="white"/>
      <rect x="8" y="8" width="28" height="28" fill="#10443e"/>
      <rect x="14" y="14" width="16" height="16" fill="white"/>
      <rect x="18" y="18" width="8" height="8" fill="#10443e"/>
      <rect x="64" y="8" width="28" height="28" fill="#10443e"/>
      <rect x="70" y="14" width="16" height="16" fill="white"/>
      <rect x="74" y="18" width="8" height="8" fill="#10443e"/>
      <rect x="8" y="64" width="28" height="28" fill="#10443e"/>
      <rect x="14" y="70" width="16" height="16" fill="white"/>
      <rect x="18" y="74" width="8" height="8" fill="#10443e"/>
      <rect x="44" y="12" width="10" height="8" fill="#10443e"/>
      <rect x="44" y="44" width="12" height="12" fill="#10443e"/>
      <rect x="64" y="48" width="8" height="8" fill="#10443e"/>
      <rect x="48" y="72" width="16" height="10" fill="#10443e"/>
      <rect x="72" y="72" width="12" height="12" fill="#10443e"/>
    </svg>
  `;
}

// --- 4. APP VIEW SWITCHER (LANDING, FARMER, CONSUMER, WORKSHEET) ---
window.switchAppView = function(viewKey) {
  audio.click();
  
  const tabButtons = document.querySelectorAll('.app-tab-btn');
  const appViews = document.querySelectorAll('.app-view');

  tabButtons.forEach(btn => {
    if (btn.dataset.view === viewKey) {
      btn.classList.add('active-app-tab');
    } else {
      btn.classList.remove('active-app-tab');
    }
  });

  appViews.forEach(view => {
    if (view.id === `view-${viewKey}`) {
      view.classList.remove('hidden');
    } else {
      view.classList.add('hidden');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- 5. FARMER APP: SIMPLE ENTRY & TAG GENERATOR ---
window.autoBatchCode = function() {
  const cropInput = document.getElementById('farmer-crop');
  const crop = cropInput ? cropInput.value.trim() : "VG";
  const prefix = (crop.substring(0, 2) || "VG").toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const code = `${prefix}-${rand}-NSK`;
  
  const batchInput = document.getElementById('farmer-batch-id');
  if (batchInput) batchInput.value = code;
  audio.click();
};

window.handleFarmerSubmit = function() {
  const crop = document.getElementById('farmer-crop').value.trim();
  const qty = parseFloat(document.getElementById('farmer-qty').value);
  const place = document.getElementById('farmer-place').value.trim();
  const dateVal = document.getElementById('farmer-date').value;
  const batchId = document.getElementById('farmer-batch-id').value.trim();
  const farmerName = document.getElementById('farmer-name').value.trim();

  audio.printSound();

  const harvestDate = dateVal ? new Date(dateVal) : new Date();
  const crates = Math.ceil(qty / 20);

  // Symbol
  let symbol = "🌱";
  const c = crop.toLowerCase();
  if (c.includes('tomato')) symbol = "🍅";
  else if (c.includes('spinach') || c.includes('palak')) symbol = "🥬";
  else if (c.includes('pepper') || c.includes('capsicum')) symbol = "🫑";
  else if (c.includes('onion')) symbol = "🧅";
  else if (c.includes('potato')) symbol = "🥔";
  else if (c.includes('carrot')) symbol = "🥕";

  const newBatch = {
    id: batchId,
    crop: crop,
    symbol: symbol,
    quantityKg: qty,
    crates: crates,
    harvestPlace: place,
    harvestDate: harvestDate,
    freshnessPct: 98,
    grade: "A+",
    farmerName: farmerName,
    farmerId: `FRM-${Math.floor(1000 + Math.random() * 9000)}`,
    farmerPrice: 24.50
  };

  batches.unshift(newBatch);
  selectedBatchId = newBatch.id;

  renderCrateLabel(newBatch);
  renderConsumerBatchButtons();
  updateConsumerPassport(newBatch);

  // Visual button confirmation
  const btn = document.getElementById('btn-create-crate-tag');
  if (btn) {
    btn.innerHTML = `<i data-lucide="check" class="w-5 h-5"></i> <span>Tag Generated &amp; Synced!</span>`;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
      btn.innerHTML = `<i data-lucide="printer" class="w-5 h-5"></i> <span>Generate &amp; Print Crate QR Sticker</span>`;
      if (window.lucide) lucide.createIcons();
    }, 1800);
  }
};

function renderCrateLabel(batch) {
  const labelCropTitle = document.getElementById('label-crop-title');
  const labelBadgeSymbol = document.getElementById('label-badge-symbol');
  const labelBatchId = document.getElementById('label-batch-id');
  const labelQuantity = document.getElementById('label-quantity');
  const labelPlaceDate = document.getElementById('label-place-date');
  const labelFreshness = document.getElementById('label-freshness');
  const qrcodeContainer = document.getElementById('qrcode-container');

  if (labelCropTitle) labelCropTitle.textContent = batch.crop;
  if (labelBadgeSymbol) labelBadgeSymbol.textContent = batch.symbol;
  
  // The 4 compulsory items on the printed label
  if (labelBatchId) labelBatchId.textContent = `#${batch.id}`;
  if (labelQuantity) labelQuantity.textContent = `${batch.quantityKg.toFixed(1)} KG (${batch.crates} Crates)`;
  
  const dateStr = batch.harvestDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const placeShort = batch.harvestPlace.split(',')[0].trim();
  if (labelPlaceDate) labelPlaceDate.textContent = `${placeShort} • ${dateStr}`;
  if (labelFreshness) labelFreshness.textContent = `${batch.freshnessPct}% (Grade ${batch.grade})`;

  // Generate QR payload containing the 4 compulsory elements
  const qrPayload = JSON.stringify({
    batch_id: batch.id,
    crop: batch.crop,
    quantity_kg: batch.quantityKg,
    harvest_place: batch.harvestPlace,
    harvest_date: batch.harvestDate.toISOString(),
    freshness: `${batch.freshnessPct}%`
  });

  renderQRCodeInto(qrcodeContainer, qrPayload);
}

// Action to test immediately in shopper app
window.testScanInShopperApp = function() {
  audio.scanBeep();
  switchAppView('consumer');
  const cur = batches.find(x => x.id === selectedBatchId) || batches[0];
  triggerConsumerScan(cur);
};

// --- 6. SHOPPER APP: SCANNER & PASSPORT DECODER ---
let cameraStream = null;
let cameraScanningInterval = null;

function renderConsumerBatchButtons() {
  const container = document.getElementById('consumer-batch-buttons');
  if (!container) return;
  container.innerHTML = '';
  batches.forEach(b => {
    const btn = document.createElement('button');
    const isSel = b.id === selectedBatchId;
    btn.className = isSel
      ? "px-2 py-1 rounded-lg bg-pine text-white border-2 border-pine text-center font-bold text-[10px] transition truncate shadow-sm"
      : "px-2 py-1 rounded-lg bg-white hover:bg-[#ede4d6] text-pine border border-pine text-center text-[10px] transition truncate";
    btn.textContent = `${b.symbol} #${b.id.split('-')[0]}`;
    btn.addEventListener('click', () => {
      selectedBatchId = b.id;
      triggerConsumerScan(b);
    });
    container.appendChild(btn);
  });
}

function triggerConsumerScan(batch) {
  audio.scanBeep();
  const statusEl = document.getElementById('consumer-scan-status');

  if (statusEl) {
    statusEl.textContent = "DECODING QR...";
    statusEl.className = "text-ochre font-bold animate-pulse";
  }

  setTimeout(() => {
    if (statusEl) {
      statusEl.textContent = `SCANNED #${batch.id}`;
      statusEl.className = "text-sage font-bold";
    }
    updateConsumerPassport(batch);
    renderConsumerBatchButtons();
  }, 220);
}

function updateConsumerPassport(b) {
  if (!b) return;

  const hoursElapsed = ((Date.now() - b.harvestDate.getTime()) / (3600 * 1000)).toFixed(1);
  const daysElapsed = (hoursElapsed / 24).toFixed(1);
  const dateStr = b.harvestDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const consumerQrTarget = document.getElementById('consumer-qr-target');
  const passportTitle = document.getElementById('passport-title');
  const passportBatchId = document.getElementById('passport-batch-id');
  const passportQuantity = document.getElementById('passport-quantity');
  const passportCratesNote = document.getElementById('passport-crates-note');
  const passportPlace = document.getElementById('passport-place');
  const passportDate = document.getElementById('passport-date');
  const passportHarvestNote = document.getElementById('passport-harvest-note');
  const passportFreshness = document.getElementById('passport-freshness');
  const passportGrade = document.getElementById('passport-grade');
  const passportFreshnessBar = document.getElementById('passport-freshness-bar');
  const passportFarmerName = document.getElementById('passport-farmer-name');
  const passportFarmerShare = document.getElementById('passport-farmer-share');

  // Render QR in consumer viewfinder target
  if (consumerQrTarget) {
    const qrPayload = JSON.stringify({
      batch_id: b.id,
      quantity_kg: b.quantityKg,
      harvest_place: b.harvestPlace,
      harvest_date: b.harvestDate.toISOString(),
      freshness: `${b.freshnessPct}%`
    });
    renderQRCodeInto(consumerQrTarget, qrPayload);
  }

  // 1. Batch ID
  if (passportBatchId) passportBatchId.textContent = `#${b.id}`;
  // 2. Quantity
  if (passportQuantity) passportQuantity.textContent = `${b.quantityKg.toFixed(1)} KG`;
  if (passportCratesNote) passportCratesNote.textContent = `${b.crates} Standard Packaging Crates`;
  // 3. Harvested Place and Date
  if (passportPlace) passportPlace.textContent = b.harvestPlace;
  if (passportDate) passportDate.textContent = dateStr;
  if (passportHarvestNote) passportHarvestNote.textContent = `${hoursElapsed} hours ago (${daysElapsed} days)`;
  // 4. Freshness Level
  if (passportFreshness) passportFreshness.textContent = `${b.freshnessPct}%`;
  if (passportGrade) passportGrade.textContent = `GRADE ${b.grade} (PREMIUM)`;
  if (passportFreshnessBar) passportFreshnessBar.style.width = `${b.freshnessPct}%`;

  if (passportTitle) passportTitle.textContent = `${b.crop} (${b.symbol})`;
  if (passportFarmerName) passportFarmerName.textContent = `Farmer: ${b.farmerName} (${b.farmerId})`;
  if (passportFarmerShare) passportFarmerShare.textContent = `₹${b.farmerPrice.toFixed(2)} / kg`;
}

// Camera Scanner Implementation
async function toggleCamera() {
  const video = document.getElementById('camera-video');
  const cameraBtnText = document.getElementById('camera-btn-text');
  const qrDisplay = document.getElementById('consumer-qr-display');

  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
    clearInterval(cameraScanningInterval);
    if (video) video.classList.add('hidden');
    if (qrDisplay) qrDisplay.classList.remove('hidden');
    if (cameraBtnText) cameraBtnText.textContent = "Start WebCam Scan";
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (video) {
      video.srcObject = cameraStream;
      video.play();
      video.classList.remove('hidden');
    }
    if (qrDisplay) qrDisplay.classList.add('hidden');
    if (cameraBtnText) cameraBtnText.textContent = "Stop Camera";

    const canvas = document.getElementById('camera-canvas') || document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    cameraScanningInterval = setInterval(() => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          audio.scanBeep();
          const target = batches.find(b => code.data.includes(b.id)) || batches[0];
          selectedBatchId = target.id;
          updateConsumerPassport(target);
          toggleCamera();
        }
      }
    }, 200);

  } catch (err) {
    alert("Camera permission not available or blocked. You can still test with the preset buttons or upload a QR image.");
    console.warn("Camera access failed", err);
  }
}

function handleQRFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          audio.scanBeep();
          const target = batches.find(b => code.data.includes(b.id)) || batches[0];
          selectedBatchId = target.id;
          updateConsumerPassport(target);
          return;
        }
      }
      audio.scanBeep();
      const cur = batches.find(b => b.id === selectedBatchId) || batches[0];
      updateConsumerPassport(cur);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// --- 7. LOSS & WASTE CALCULATOR (STEP 1 Q2) ---
function updateCalculator() {
  const sliderTonnes = document.getElementById('slider-tonnes');
  const sliderLoss = document.getElementById('slider-loss');
  const sliderPrice = document.getElementById('slider-price');

  const sliderTonnesVal = document.getElementById('slider-tonnes-val');
  const sliderLossVal = document.getElementById('slider-loss-val');
  const sliderPriceVal = document.getElementById('slider-price-val');

  const calcResultRupees = document.getElementById('calc-result-rupees');
  const calcResultTonnes = document.getElementById('calc-result-tonnes');
  const calcResultHouseholds = document.getElementById('calc-result-households');
  const calcSavingsRupees = document.getElementById('calc-savings-rupees');

  if (!sliderTonnes || !sliderLoss || !sliderPrice) return;
  const annualTonnes = parseFloat(sliderTonnes.value);
  const lossPercent = parseFloat(sliderLoss.value);
  const priceKg = parseFloat(sliderPrice.value);

  const wastedTonnes = annualTonnes * (lossPercent / 100);
  const wastedKg = wastedTonnes * 1000000 * 1000;
  const wastedRupees = wastedKg * priceKg;
  const lakhCrores = wastedRupees / 1000000000000;

  const householdsFed = Math.round((wastedKg / 720) / 1000000);
  const savingsCrores = (wastedRupees * 0.30) / 10000000;

  if (sliderTonnesVal) sliderTonnesVal.textContent = `${annualTonnes} Million Tonnes`;
  if (sliderLossVal) sliderLossVal.textContent = `${lossPercent}%`;
  if (sliderPriceVal) sliderPriceVal.textContent = `₹${priceKg} / kg`;

  if (calcResultRupees) calcResultRupees.textContent = `₹${lakhCrores.toFixed(2)} Lakh Cr`;
  if (calcResultTonnes) calcResultTonnes.textContent = `${wastedTonnes.toFixed(1)} Million`;
  if (calcResultHouseholds) calcResultHouseholds.textContent = `${householdsFed} Million`;
  if (calcSavingsRupees) calcSavingsRupees.textContent = `₹${Math.round(savingsCrores).toLocaleString('en-IN')} Cr / yr`;
}

// --- 8. INITIALIZE APP ---
function initApp() {
  // Set default datetime to now in farmer form
  const dtInput = document.getElementById('farmer-date');
  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0, 16);
  }

  // Audio Toggle
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const soundStatusEl = document.getElementById('sound-status');
  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      audio.enabled = !audio.enabled;
      if (soundStatusEl) soundStatusEl.textContent = audio.enabled ? 'ON' : 'MUTED';
      audio.click();
    });
  }

  // Reset Demo
  const quickResetDemoBtn = document.getElementById('quick-reset-demo');
  if (quickResetDemoBtn) {
    quickResetDemoBtn.addEventListener('click', () => {
      audio.success();
      batches = JSON.parse(JSON.stringify(initialBatches));
      batches.forEach((b, i) => {
        b.harvestDate = new Date(initialBatches[i].harvestDate);
      });
      selectedBatchId = "TM-8402-NSK";
      renderCrateLabel(batches[0]);
      renderConsumerBatchButtons();
      updateConsumerPassport(batches[0]);
    });
  }

  // Shopper Scanner Controls
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const qrFileInput = document.getElementById('qr-file-input');
  const consumerQrDisplay = document.getElementById('consumer-qr-display');

  if (btnToggleCamera) btnToggleCamera.addEventListener('click', toggleCamera);
  if (qrFileInput) qrFileInput.addEventListener('change', handleQRFileUpload);
  if (consumerQrDisplay) {
    consumerQrDisplay.addEventListener('click', () => {
      const cur = batches.find(x => x.id === selectedBatchId) || batches[0];
      triggerConsumerScan(cur);
    });
  }

  // Loss Calculator Controls
  const sliderTonnes = document.getElementById('slider-tonnes');
  const sliderLoss = document.getElementById('slider-loss');
  const sliderPrice = document.getElementById('slider-price');
  const calcResetBtn = document.getElementById('calc-reset-btn');

  if (sliderTonnes) sliderTonnes.addEventListener('input', () => { updateCalculator(); audio.click(); });
  if (sliderLoss) sliderLoss.addEventListener('input', () => { updateCalculator(); audio.click(); });
  if (sliderPrice) sliderPrice.addEventListener('input', () => { updateCalculator(); audio.click(); });

  if (calcResetBtn) {
    calcResetBtn.addEventListener('click', () => {
      audio.success();
      sliderTonnes.value = 200;
      sliderLoss.value = 35;
      sliderPrice.value = 30;
      updateCalculator();
    });
  }

  // Render Initial Views
  renderCrateLabel(batches[0]);
  renderConsumerBatchButtons();
  updateConsumerPassport(batches[0]);
  updateCalculator();

  if (window.lucide) lucide.createIcons();
}

// Guaranteed launch
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

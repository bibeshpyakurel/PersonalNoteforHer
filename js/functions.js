
let gardenCtx, gardenCanvas, garden;

document.addEventListener('DOMContentLoaded', function() {
    // Setup garden canvas
    const loveHeart = document.getElementById('loveHeart');
    const offsetX = loveHeart.offsetWidth / 2;
    const offsetY = loveHeart.offsetHeight / 2 - 55;
    
    window.offsetX = offsetX;
    window.offsetY = offsetY;
    
    gardenCanvas = document.getElementById('garden');
    gardenCanvas.width = loveHeart.offsetWidth;
    gardenCanvas.height = loveHeart.offsetHeight;
    
    gardenCtx = gardenCanvas.getContext('2d');
    gardenCtx.globalCompositeOperation = 'lighter';
    garden = new Garden(gardenCtx, gardenCanvas);

    // Render loop
    setInterval(function () {
        garden.render();
    }, Garden.options.growSpeed);
});

function getHeartPoint(angle) {
    const t = angle / Math.PI;
    const x = 19.5 * (16 * Math.pow(Math.sin(t), 3));
    const y = -20 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [window.offsetX + x, window.offsetY + y];
}

function startHeartAnimation() {
    const interval = 50;
    let angle = 10;
    const heart = [];
    
    const animationTimer = setInterval(function () {
        const bloom = getHeartPoint(angle);
        let draw = true;
        
        for (let i = 0; i < heart.length; i++) {
            const p = heart[i];
            const distance = Math.sqrt(Math.pow(p[0] - bloom[0], 2) + Math.pow(p[1] - bloom[1], 2));
            if (distance < Garden.options.bloomRadius.max * 1.3) {
                draw = false;
                break;
            }
        }
        
        if (draw) {
            heart.push(bloom);
            garden.createRandomBloom(bloom[0], bloom[1]);
        }
        
        if (angle >= 30) {
            clearInterval(animationTimer);
            showMessages();
        } else {
            angle += 0.2;
        }
    }, interval);
}

function timeElapse(date) {
    const now = new Date();

    // seconds, minutes, hours, days (existing display)
    const secondsTotal = Math.floor((now.getTime() - date.getTime()) / 1000);
    const days = Math.floor(secondsTotal / (3600 * 24));
    let remaining = secondsTotal % (3600 * 24);
    let hours = Math.floor(remaining / 3600);
    if (hours < 10) hours = '0' + hours;
    remaining = remaining % 3600;
    let minutes = Math.floor(remaining / 60);
    if (minutes < 10) minutes = '0' + minutes;
    let secs = remaining % 60;
    if (secs < 10) secs = '0' + secs;

    const result = `<span class="digit">${days}</span> days <span class="digit">${hours}</span> hours <span class="digit">${minutes}</span> minutes <span class="digit">${secs}</span> seconds`;
    const elapseClock = document.getElementById('elapseClock');
    if (elapseClock) elapseClock.innerHTML = result;

    // months and days (calendar-aware) + decimal years
    const yearsEl = document.getElementById('elapsedYears');
    const monthsEl = document.getElementById('elapsedMonths');

    // total months approximation by calendar difference
    let monthsTotal = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    // adjust if the current day hasn't reached the start-day yet
    const tentative = new Date(date.getFullYear(), date.getMonth() + monthsTotal, date.getDate());
    if (tentative > now) {
        monthsTotal -= 1;
    }
    if (monthsTotal < 0) monthsTotal = 0;

    // compute remaining days after subtracting full months
    const anchor = new Date(date.getFullYear(), date.getMonth() + monthsTotal, date.getDate());
    const dayMs = 24 * 3600 * 1000;
    let daysRemain = Math.floor((now - anchor) / dayMs);
    if (daysRemain < 0) daysRemain = 0;

    const months = monthsTotal % 12;
    const yearsWhole = Math.floor(monthsTotal / 12);

    const monthsText = `${months} month${months === 1 ? '' : 's'} and ${daysRemain} day${daysRemain === 1 ? '' : 's'}`;
    if (monthsEl) {
        monthsEl.textContent = monthsText;
    }

    // years in decimal form (approx using average year length), rounded to 1 decimal
    const yearsDecimal = ((now - date) / (365.25 * dayMs));
    const yearsDecimalText = `${yearsDecimal.toFixed(1)} years`;
    if (yearsEl) {
        yearsEl.textContent = yearsDecimalText;
    }

    // also update heart overlay counters if present
    const heartMonthsEl = document.getElementById('heartMonths');
    const heartYearsEl = document.getElementById('heartYears');
    if (heartMonthsEl) heartMonthsEl.textContent = monthsText;
    if (heartYearsEl) heartYearsEl.textContent = yearsDecimalText;
}

function showMessages() {
    adjustWordsPosition();
    const messages = document.getElementById('messages');
    if (messages) {
        fadeIn(messages, 5000, function() {
            showLoveU();
        });
    }
}

function adjustWordsPosition() {
    const words = document.getElementById('words');
    const garden = document.getElementById('garden');
    if (words && garden) {
        words.style.position = 'absolute';
        words.style.top = (garden.offsetTop + 195) + 'px';
        words.style.left = (garden.offsetLeft + 70) + 'px';
    }
}

function showLoveU() {
    const loveu = document.getElementById('loveu');
    const heartText = document.getElementById('heartText');

    // prepare romantic text from CONFIG if available
    if (heartText) {
        const msg = (typeof CONFIG !== 'undefined' && CONFIG.message) ? CONFIG.message : 'I LOVE YOU SO MUCH';
        const sender = (typeof CONFIG !== 'undefined' && CONFIG.senderName) ? CONFIG.senderName : '';
        heartText.innerHTML = `${msg}<span class="signature">- ${sender}</span><div class="heartCounters"><div id="heartMonths" style="margin-top:8px;font-size:14px;opacity:0.95"></div><div id="heartYears" style="margin-top:4px;font-size:16px;opacity:0.95"></div></div>`;
        fadeIn(heartText, 2200);
    }

    if (loveu) {
        // delay showing the small loveu block so heart text appears slightly earlier
        setTimeout(function() { fadeIn(loveu, 2000); }, 600);
    }
}

function fadeIn(element, duration, callback) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = Date.now();
    
    function animate() {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (callback) {
            callback();
        }
    }
    
    requestAnimationFrame(animate);
}

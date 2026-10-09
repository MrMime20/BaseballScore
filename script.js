// script.js - Clean, Modern Mobile Baseball Scorekeeper

document.addEventListener('DOMContentLoaded', () => {
  // --- Game State Variables ---
  let homeScoreVal = 0;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true; // true = Top (Away bats), false = Bottom (Home bats)
  let currentOuts = 0;
  let secondsElapsed = 0;
  let isTimerRunning = true;
  let timerInterval = null;

  let homeTeamName = localStorage.getItem('baseball_home_team') || 'Home';
  let awayTeamName = localStorage.getItem('baseball_away_team') || 'Away';
  let selectedShareFormat = 'basic'; // 'basic', 'standard', 'broadcast'
  let currentTheme = localStorage.getItem('baseball_theme') || 'light';

  // Apply saved theme
  document.body.setAttribute('data-theme', currentTheme);

  // --- DOM Elements ---
  const homeScoreEl = document.getElementById('home-score');
  const awayScoreEl = document.getElementById('away-score');
  const homeLabelEl = document.getElementById('home-label');
  const awayLabelEl = document.getElementById('away-label');
  const teamLabelsContainer = document.getElementById('team-labels-container');
  const battingUnderline = document.getElementById('batting-underline');

  const inningContainer = document.getElementById('inning-container');
  const inningValEl = document.getElementById('inning-val');
  const inningUpBtn = document.getElementById('inning-up');
  const inningDownBtn = document.getElementById('inning-down');

  const outsContainer = document.getElementById('outs-container');
  const outCircles = document.querySelectorAll('.out-circle');

  const timerDisplay = document.getElementById('timer-display');
  const timerEl = document.getElementById('timer');
  const timerIcon = document.getElementById('timer-icon');

  // Settings Elements
  const settingsBtn = document.getElementById('settings-btn');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const homeNameInput = document.getElementById('home-name-input');
  const awayNameInput = document.getElementById('away-name-input');
  const themeCards = document.querySelectorAll('.theme-card');
  const modalTimerToggleBtn = document.getElementById('modal-timer-toggle-btn');
  const modalTimerIcon = document.getElementById('modal-timer-icon');
  const modalTimerText = document.getElementById('modal-timer-text');
  const modalTimerResetBtn = document.getElementById('modal-timer-reset-btn');
  const clearRunsBtn = document.getElementById('clear-runs-btn');
  const resetGameBtn = document.getElementById('reset-game-btn');

  // Share Elements
  const shareBtn = document.getElementById('share-btn');
  const shareBackdrop = document.getElementById('share-backdrop');
  const closeShareBtn = document.getElementById('close-share-btn');
  const summaryCards = document.querySelectorAll('.summary-card');
  const sharePreviewText = document.getElementById('share-preview-text');
  const copyPreviewBtn = document.getElementById('copy-preview-btn');
  const speakPreviewBtn = document.getElementById('speak-preview-btn');
  const shareNativeBtn = document.getElementById('share-native-btn');
  const shareSmsBtn = document.getElementById('share-sms-btn');
  const shareEmailBtn = document.getElementById('share-email-btn');
  const shareCopyBtn = document.getElementById('share-copy-btn');

  // Timeouts & Tracking
  let sideChangeTimeout = null;
  let toastHideTimeout = null;
  let speechSynthUtterance = null;

  // --- Visual Feedback & Toast Utilities ---
  function triggerPop(element) {
    if (!element) return;
    element.classList.remove('pop-feedback');
    void element.offsetWidth; // Force reflow
    element.classList.add('pop-feedback');
  }

  function showInningToast(badgeText, messageText) {
    const toast = document.getElementById('inning-toast');
    const toastBadge = document.getElementById('toast-badge');
    const toastText = document.getElementById('toast-message');

    if (!toast) return;
    if (toastBadge) toastBadge.textContent = badgeText;
    if (toastText) toastText.textContent = messageText;

    toast.classList.add('show');
    clearTimeout(toastHideTimeout);
    toastHideTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 1800);
  }

  // --- Sliding Underline Positioner ---
  function updateUnderlinePosition() {
    if (!teamLabelsContainer || !battingUnderline || !awayLabelEl || !homeLabelEl) return;

    const targetLabel = isTopInning ? awayLabelEl : homeLabelEl;
    const containerRect = teamLabelsContainer.getBoundingClientRect();
    const labelRect = targetLabel.getBoundingClientRect();

    if (containerRect.width === 0 || labelRect.width === 0) return;

    const leftOffset = labelRect.left - containerRect.left;
    const labelWidth = labelRect.width;

    battingUnderline.style.width = `${labelWidth}px`;
    battingUnderline.style.transform = `translateX(${leftOffset}px)`;
  }

  window.addEventListener('resize', updateUnderlinePosition);
  setTimeout(updateUnderlinePosition, 80);
  setTimeout(updateUnderlinePosition, 300);

  // --- Mobile Pull-To-Refresh Prevention ---
  function preventMobilePullToRefresh(el) {
    if (!el) return;
    el.addEventListener('touchmove', (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  preventMobilePullToRefresh(homeScoreEl);
  preventMobilePullToRefresh(awayScoreEl);
  preventMobilePullToRefresh(inningContainer);
  preventMobilePullToRefresh(outsContainer);
  preventMobilePullToRefresh(document.querySelector('.score-card'));

  // --- Runs (Score) Modification Logic ---
  function changeHomeScore(delta) {
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
    updateSharePreview();
    if (navigator.vibrate) navigator.vibrate(20);
  }

  function changeAwayScore(delta) {
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
    updateSharePreview();
    if (navigator.vibrate) navigator.vibrate(20);
  }

  // --- Gesture Detection for Score Elements ---
  function setupSwipeGestures(element, { onSwipeUp, onSwipeDown, onTap }) {
    if (!element) return;

    let startX = 0;
    let startY = 0;
    let isTracking = false;
    let moved = false;
    let startTime = 0;

    element.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
      isTracking = true;
      moved = false;

      if (typeof element.setPointerCapture === 'function') {
        try {
          element.setPointerCapture(e.pointerId);
        } catch (_) {}
      }
    });

    element.addEventListener('pointermove', (e) => {
      if (!isTracking) return;
      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        moved = true;
      }
    });

    const handlePointerEnd = (e) => {
      if (!isTracking) return;
      isTracking = false;

      const diffY = e.clientY - startY;
      const elapsed = Date.now() - startTime;
      const threshold = 18;

      if (Math.abs(diffY) >= threshold) {
        if (diffY < 0 && onSwipeUp) {
          onSwipeUp();
          return;
        } else if (diffY > 0 && onSwipeDown) {
          onSwipeDown();
          return;
        }
      }

      if (!moved && elapsed < 400 && onTap) {
        onTap(e);
      }
    };

    element.addEventListener('pointerup', handlePointerEnd);
    element.addEventListener('pointercancel', () => {
      isTracking = false;
      moved = false;
    });
  }

  // Attach Gestures to Scores
  setupSwipeGestures(homeScoreEl, {
    onSwipeUp: () => changeHomeScore(+1),
    onSwipeDown: () => changeHomeScore(-1),
    onTap: () => changeHomeScore(+1)
  });

  setupSwipeGestures(awayScoreEl, {
    onSwipeUp: () => changeAwayScore(+1),
    onSwipeDown: () => changeAwayScore(-1),
    onTap: () => changeAwayScore(+1)
  });

  if (homeScoreEl) {
    homeScoreEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeHomeScore(-1);
    });
  }

  if (awayScoreEl) {
    awayScoreEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeAwayScore(-1);
    });
  }

  // --- Inning Display Update ---
  function updateInningDisplay() {
    if (inningValEl) {
      inningValEl.textContent = currentInning;
    }

    if (inningUpBtn) {
      inningUpBtn.classList.toggle('active', isTopInning);
      inningUpBtn.setAttribute('aria-pressed', isTopInning ? 'true' : 'false');
      inningUpBtn.title = isTopInning ? 'Top of Inning' : 'Set Top of Inning';
    }
    if (inningDownBtn) {
      inningDownBtn.classList.toggle('active', !isTopInning);
      inningDownBtn.setAttribute('aria-pressed', !isTopInning ? 'true' : 'false');
      inningDownBtn.title = !isTopInning ? 'Bottom of Inning' : 'Set Bottom of Inning';
    }

    if (awayLabelEl && homeLabelEl) {
      awayLabelEl.classList.toggle('batting', isTopInning);
      homeLabelEl.classList.toggle('batting', !isTopInning);
    }

    requestAnimationFrame(updateUnderlinePosition);
    updateSharePreview();
  }

  // Advance by 1 half-inning
  function advanceHalfInning() {
    clearTimeout(sideChangeTimeout);
    if (isTopInning) {
      isTopInning = false;
    } else {
      currentInning++;
      isTopInning = true;
    }
    triggerPop(inningContainer);
    updateInningDisplay();
    if (navigator.vibrate) navigator.vibrate(20);
  }

  // Decrease by 1 half-inning
  function decreaseHalfInning() {
    clearTimeout(sideChangeTimeout);
    let changed = false;
    if (!isTopInning) {
      isTopInning = true;
      changed = true;
    } else if (currentInning > 1) {
      currentInning--;
      isTopInning = false;
      changed = true;
    }
    if (changed) {
      triggerPop(inningContainer);
      updateInningDisplay();
      if (navigator.vibrate) navigator.vibrate(15);
      return true;
    }
    return false;
  }

  // --- Inning Counter Tap & Tap-and-Hold Logic ---
  // TAPPED: increases by 1 half-inning
  // TAPPED AND HELD: decreases by 1 half-inning incrementally (slow, smooth, easy to control)
  let inningHoldTimeout = null;
  let inningHoldInterval = null;
  let isHoldingInning = false;
  let inningPressStartTime = 0;

  function startInningHoldTracking(e) {
    if (e.button !== undefined && e.button !== 0) return;
    isHoldingInning = false;
    inningPressStartTime = Date.now();

    clearTimeout(inningHoldTimeout);
    clearInterval(inningHoldInterval);

    // After 400ms of holding down, trigger initial decrease and start slow 500ms step interval
    inningHoldTimeout = setTimeout(() => {
      isHoldingInning = true;
      decreaseHalfInning();

      // Decrement incrementally every 500ms (slow and steady, no crazy reflexes required!)
      inningHoldInterval = setInterval(() => {
        const stillDecreased = decreaseHalfInning();
        if (!stillDecreased) {
          clearInterval(inningHoldInterval);
        }
      }, 500);
    }, 400);
  }

  function endInningHoldTracking() {
    clearTimeout(inningHoldTimeout);
    clearInterval(inningHoldInterval);

    const pressDuration = Date.now() - inningPressStartTime;

    // If it was a quick tap (not held)
    if (!isHoldingInning && pressDuration < 400 && pressDuration > 10) {
      advanceHalfInning();
    }
    isHoldingInning = false;
  }

  function cancelInningHoldTracking() {
    clearTimeout(inningHoldTimeout);
    clearInterval(inningHoldInterval);
    isHoldingInning = false;
  }

  if (inningContainer) {
    inningContainer.addEventListener('pointerdown', startInningHoldTracking);
    inningContainer.addEventListener('pointerup', endInningHoldTracking);
    inningContainer.addEventListener('pointercancel', cancelInningHoldTracking);
    inningContainer.addEventListener('pointerleave', cancelInningHoldTracking);

    inningContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      decreaseHalfInning();
    });
  }

  // Tapping Home or Away team label swaps batting side
  if (homeLabelEl) {
    homeLabelEl.addEventListener('click', () => {
      if (isTopInning) {
        clearTimeout(sideChangeTimeout);
        isTopInning = false;
        triggerPop(homeLabelEl);
        updateInningDisplay();
      }
    });
  }

  if (awayLabelEl) {
    awayLabelEl.addEventListener('click', () => {
      if (!isTopInning) {
        clearTimeout(sideChangeTimeout);
        isTopInning = true;
        triggerPop(awayLabelEl);
        updateInningDisplay();
      }
    });
  }

  // --- Automatic 3-Outs Side Change ---
  function handleThreeOuts() {
    clearTimeout(sideChangeTimeout);

    currentOuts = 3;
    updateOutsDisplay();

    if (outsContainer) {
      outsContainer.classList.remove('flash-3outs');
      void outsContainer.offsetWidth;
      outsContainer.classList.add('flash-3outs');
    }

    showInningToast('3 OUTS', 'CHANGE SIDES');

    sideChangeTimeout = setTimeout(() => {
      currentOuts = 0;
      updateOutsDisplay();
      advanceHalfInning();
    }, 450);
  }

  function updateOutsDisplay() {
    outCircles.forEach((circle) => {
      const outNum = parseInt(circle.getAttribute('data-out'), 10);
      circle.classList.toggle('active', outNum <= currentOuts);
    });
    updateSharePreview();
  }

  function changeOuts(delta) {
    if (delta > 0) {
      if (currentOuts + 1 >= 3) {
        handleThreeOuts();
      } else {
        clearTimeout(sideChangeTimeout);
        currentOuts += delta;
        triggerPop(outsContainer);
        updateOutsDisplay();
      }
    } else {
      clearTimeout(sideChangeTimeout);
      currentOuts = Math.max(0, currentOuts + delta);
      triggerPop(outsContainer);
      updateOutsDisplay();
    }
  }

  outCircles.forEach((circle) => {
    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickedOut = parseInt(circle.getAttribute('data-out'), 10);
      if (currentOuts === clickedOut) {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut - 1;
        triggerPop(outsContainer);
        updateOutsDisplay();
      } else if (clickedOut === 3) {
        handleThreeOuts();
      } else {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut;
        triggerPop(outsContainer);
        updateOutsDisplay();
      }
    });
  });

  if (outsContainer) {
    outsContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeOuts(-1);
    });
  }

  // --- Stopwatch Game Clock ---
  function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isTimerRunning) {
        secondsElapsed++;
        if (timerEl) timerEl.textContent = formatTime(secondsElapsed);
      }
    }, 1000);
  }

  function updateTimerUI() {
    if (timerDisplay) {
      timerDisplay.classList.toggle('paused', !isTimerRunning);
    }
    if (timerIcon) {
      timerIcon.className = isTimerRunning ? 'fa-solid fa-play' : 'fa-solid fa-pause';
    }
    if (modalTimerIcon) {
      modalTimerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerText) {
      modalTimerText.textContent = isTimerRunning ? 'Pause Clock' : 'Resume Clock';
    }
  }

  function toggleTimer() {
    isTimerRunning = !isTimerRunning;
    updateTimerUI();
    showInningToast('CLOCK', isTimerRunning ? 'RESUMED' : 'PAUSED');
  }

  function resetTimer() {
    secondsElapsed = 0;
    if (timerEl) {
      timerEl.textContent = formatTime(0);
      triggerPop(timerDisplay);
    }
    showInningToast('CLOCK', 'RESET (00:00:00)');
    updateSharePreview();
  }

  startTimer();

  if (timerDisplay) {
    timerDisplay.addEventListener('click', toggleTimer);
    timerDisplay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // --- Settings Drawer ---
  function openSettings() {
    if (!settingsBackdrop) return;
    if (homeNameInput) homeNameInput.value = homeTeamName;
    if (awayNameInput) awayNameInput.value = awayTeamName;
    settingsBackdrop.classList.add('open');
    settingsBackdrop.setAttribute('aria-hidden', 'false');
    updateTimerUI();
  }

  function closeSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.remove('open');
    settingsBackdrop.setAttribute('aria-hidden', 'true');
    setTimeout(updateUnderlinePosition, 100);
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettings);
  }

  if (settingsBackdrop) {
    settingsBackdrop.addEventListener('click', (e) => {
      if (e.target === settingsBackdrop) closeSettings();
    });
  }

  // Theme Picker
  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      if (!theme) return;
      currentTheme = theme;
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('baseball_theme', theme);

      themeCards.forEach((c) => c.classList.toggle('active', c === card));
      triggerPop(card);
      updateUnderlinePosition();
    });
  });

  // Set active theme card on start
  themeCards.forEach((c) => c.classList.toggle('active', c.getAttribute('data-theme') === currentTheme));

  // Team Names Input
  if (homeNameInput) {
    homeNameInput.addEventListener('input', () => {
      homeTeamName = homeNameInput.value.trim() || 'Home';
      if (homeLabelEl) homeLabelEl.textContent = homeTeamName;
      localStorage.setItem('baseball_home_team', homeTeamName);
      updateUnderlinePosition();
      updateSharePreview();
    });
  }

  if (awayNameInput) {
    awayNameInput.addEventListener('input', () => {
      awayTeamName = awayNameInput.value.trim() || 'Away';
      if (awayLabelEl) awayLabelEl.textContent = awayTeamName;
      localStorage.setItem('baseball_away_team', awayTeamName);
      updateUnderlinePosition();
      updateSharePreview();
    });
  }

  if (homeLabelEl) homeLabelEl.textContent = homeTeamName;
  if (awayLabelEl) awayLabelEl.textContent = awayTeamName;

  // Modal Clock Controls
  if (modalTimerToggleBtn) {
    modalTimerToggleBtn.addEventListener('click', toggleTimer);
  }

  if (modalTimerResetBtn) {
    modalTimerResetBtn.addEventListener('click', resetTimer);
  }

  // Clear Runs
  if (clearRunsBtn) {
    clearRunsBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      updateSharePreview();
      showInningToast('SCORES', 'RESET TO 0 - 0');
      closeSettings();
    });
  }

  // New Game
  if (resetGameBtn) {
    resetGameBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      currentInning = 1;
      isTopInning = true;
      currentOuts = 0;
      secondsElapsed = 0;

      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      if (timerEl) timerEl.textContent = formatTime(0);

      clearTimeout(sideChangeTimeout);
      updateInningDisplay();
      updateOutsDisplay();
      updateTimerUI();
      showInningToast('GAME', 'NEW GAME STARTED');
      closeSettings();
    });
  }

  // --- Live Sportscast Authentic Broadcaster Commentary Generator ---
  function getOrdinal(num) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function generateSportscastAnnouncerCall() {
    const half = isTopInning ? 'top' : 'bottom';
    const ordInning = `${currentInning}${getOrdinal(currentInning)}`;
    const outsStr = currentOuts === 1 ? '1 out' : `${currentOuts} outs`;
    const diff = Math.abs(homeScoreVal - awayScoreVal);
    const leader = homeScoreVal > awayScoreVal ? homeTeamName : (awayScoreVal > homeScoreVal ? awayTeamName : null);
    const trailer = homeScoreVal > awayScoreVal ? awayTeamName : (awayScoreVal > homeScoreVal ? homeTeamName : null);
    const leadScore = Math.max(homeScoreVal, awayScoreVal);
    const trailScore = Math.min(homeScoreVal, awayScoreVal);
    const batting = isTopInning ? awayTeamName : homeTeamName;

    // Stem 1: Tied Ballgame
    if (diff === 0) {
      if (homeScoreVal === 0) {
        const scorelessStems = [
          `"Welcome in baseball fans! We've got a classic pitchers' duel underway. Not a single run on the board as ${homeTeamName} and ${awayTeamName} are locked at 0-0 in the ${half} of the ${ordInning} with ${outsStr}."`,
          `"Zeroes across the scoreboard folks! Both starting arms are dealing pure fire. It's ${homeTeamName} 0, ${awayTeamName} 0 in the ${half} of the ${ordInning} with ${outsStr}. Who is gonna blink first?"`,
          `"Defensive clinic out there today! Scoreless at 0-0 between ${homeTeamName} and ${awayTeamName} in the ${half} of the ${ordInning}."`
        ];
        return scorelessStems[Math.floor(Math.random() * scorelessStems.length)];
      } else {
        const tiedStems = [
          `"Folks, we've got a dead heat! All knotted up at ${homeScoreVal} apiece as ${batting} steps in here in the ${half} of the ${ordInning} with ${outsStr}. Anyone's ballgame right now!"`,
          `"Back to square one! ${homeTeamName} and ${awayTeamName} are deadlocked at ${homeScoreVal} runs each in the ${half} of the ${ordInning}. The next big swing could decide this clash!"`,
          `"You couldn't slip a sheet of paper between these two clubs today! Tied at ${homeScoreVal} to ${awayScoreVal} with ${outsStr} in the ${half} of the ${ordInning}!"`
        ];
        return tiedStems[Math.floor(Math.random() * tiedStems.length)];
      }
    }

    // Stem 2: Crushing / Blowout (diff >= 4)
    if (diff >= 4) {
      const crushingStems = [
        `"And what an absolute shellacking we are witnessing! ${leader} is completely crushing ${trailer}, pouring it on for a commanding ${leadScore} to ${trailScore} lead in the ${half} of the ${ordInning}!"`,
        `"Hold onto your caps, folks, because ${leader} is running away with this one! An explosive offensive clinic has them blowing out ${trailer} ${leadScore}-${trailScore} in the ${half} of the ${ordInning} with ${outsStr}."`,
        `"Total and utter dominance from ${leader}! They are pulverizing the baseball today, leading ${leadScore} to ${trailScore} over a shell-shocked ${trailer} dugout in the ${half} of the ${ordInning}."`,
        `"This one has turned into a runaway train! ${leader} is crushing ${trailer} by ${diff} runs, sitting pretty at ${leadScore}-${trailScore} in the ${half} of the ${ordInning}!"`
      ];
      return crushingStems[Math.floor(Math.random() * crushingStems.length)];
    }

    // Stem 3: Barely Scraping By / Nail-biter (diff === 1)
    if (diff === 1) {
      const scrapingStems = [
        `"Talk about edge-of-your-seat drama! ${leader} is barely scraping by with a razor-thin ${leadScore}-${trailScore} edge over ${trailer} in the ${half} of the ${ordInning} with ${outsStr}."`,
        `"Every single pitch is magnified right now! ${leader} is clinging for dear life to a fragile 1-run lead, up ${leadScore} to ${trailScore} as ${trailer} lurks just one swing away in the ${half} of the ${ordInning}!"`,
        `"A pure white-knuckle thriller, baseball fans! ${leader} is barely scraping by with a slim ${leadScore}-${trailScore} cushion. Tension is so thick in the ballpark you could cut it with a knife!"`,
        `"Down to the wire! ${leader} holds the slimmest margin in sports—protecting a tight 1-run lead, ${leadScore}-${trailScore} over ${trailer} with ${outsStr} in the ${half} of the ${ordInning}!"`
      ];
      return scrapingStems[Math.floor(Math.random() * scrapingStems.length)];
    }

    // Stem 4: Solid Lead (diff 2 or 3)
    const solidStems = [
      `"${leader} holding steady control right now! They carry a solid ${leadScore}-${trailScore} lead over ${trailer} as play continues in the ${half} of the ${ordInning} with ${outsStr}."`,
      `"${leader} keeping ${trailer} at arm's length! It's a ${leadScore}-${trailScore} ballgame in the ${half} of the ${ordInning}. ${trailer} needs to string some hits together soon!"`,
      `"Good situational baseball on display! ${leader} is in front ${leadScore} to ${trailScore} over ${trailer} in the ${half} of the ${ordInning} with ${outsStr}."`
    ];
    return solidStems[Math.floor(Math.random() * solidStems.length)];
  }

  // --- Share Message Formatter ---
  function generateShareMessage(format) {
    const half = isTopInning ? 'Top' : 'Bottom';
    const outsStr = `${currentOuts} ${currentOuts === 1 ? 'Out' : 'Outs'}`;
    const timeStr = formatTime(secondsElapsed);

    switch (format) {
      case 'basic':
        return `${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;

      case 'standard':
        return `${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName} (${half} ${currentInning} • ${outsStr} • Clock: ${timeStr})`;

      case 'broadcast':
        return generateSportscastAnnouncerCall();

      default:
        return `${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;
    }
  }

  function updateSharePreview() {
    if (!sharePreviewText) return;
    sharePreviewText.textContent = generateShareMessage(selectedShareFormat);
  }

  // Speak Aloud feature using SpeechSynthesis
  function speakSportscast() {
    if (!('speechSynthesis' in window)) {
      showInningToast('AUDIO', 'Speech not supported on this browser');
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = sharePreviewText ? sharePreviewText.textContent : generateSportscastAnnouncerCall();
    speechSynthUtterance = new SpeechSynthesisUtterance(textToSpeak);
    speechSynthUtterance.rate = 1.05; // Slightly upbeat baseball tempo
    speechSynthUtterance.pitch = 1.0;

    if (speakPreviewBtn) {
      speakPreviewBtn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> <span>Playing...</span>`;
      speechSynthUtterance.onend = () => {
        speakPreviewBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span>Announce</span>`;
      };
      speechSynthUtterance.onerror = () => {
        speakPreviewBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span>Announce</span>`;
      };
    }

    window.speechSynthesis.speak(speechSynthUtterance);
  }

  if (speakPreviewBtn) {
    speakPreviewBtn.addEventListener('click', speakSportscast);
  }

  // --- Share Drawer Actions ---
  function openShareMenu() {
    if (!shareBackdrop) return;
    updateSharePreview();
    shareBackdrop.classList.add('open');
    shareBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeShareMenu() {
    if (!shareBackdrop) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    shareBackdrop.classList.remove('open');
    shareBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', openShareMenu);
  }

  if (closeShareBtn) {
    closeShareBtn.addEventListener('click', closeShareMenu);
  }

  if (shareBackdrop) {
    shareBackdrop.addEventListener('click', (e) => {
      if (e.target === shareBackdrop) closeShareMenu();
    });
  }

  // Escape Key to close drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shareBackdrop && shareBackdrop.classList.contains('open')) closeShareMenu();
      if (settingsBackdrop && settingsBackdrop.classList.contains('open')) closeSettings();
    }
  });

  // Summary Format Cards
  summaryCards.forEach((card) => {
    card.addEventListener('click', () => {
      const format = card.getAttribute('data-format');
      if (!format) return;
      selectedShareFormat = format;

      summaryCards.forEach((c) => c.classList.toggle('active', c === card));
      updateSharePreview();
      triggerPop(document.getElementById('share-preview-box'));
    });
  });

  // Copy Preview Button
  function copyTextToClipboard(text, btnElement) {
    const doFeedback = () => {
      showInningToast('COPIED', 'Score copied to clipboard');
      if (btnElement) {
        const originalContent = btnElement.innerHTML;
        btnElement.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied!</span>`;
        setTimeout(() => {
          btnElement.innerHTML = originalContent;
        }, 1500);
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doFeedback).catch(() => {
        fallbackCopy(text);
        doFeedback();
      });
    } else {
      fallbackCopy(text);
      doFeedback();
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (_) {}
    document.body.removeChild(textArea);
  }

  if (copyPreviewBtn) {
    copyPreviewBtn.addEventListener('click', () => {
      const text = sharePreviewText ? sharePreviewText.textContent : generateShareMessage(selectedShareFormat);
      copyTextToClipboard(text, copyPreviewBtn);
    });
  }

  // Share Channels
  if (shareNativeBtn) {
    shareNativeBtn.addEventListener('click', () => {
      const text = generateShareMessage(selectedShareFormat);
      if (navigator.share) {
        navigator.share({
          title: `${homeTeamName} vs ${awayTeamName}`,
          text: text
        }).catch(() => {});
      } else {
        copyTextToClipboard(text, shareNativeBtn);
      }
    });
  }

  if (shareSmsBtn) {
    shareSmsBtn.addEventListener('click', () => {
      const text = generateShareMessage(selectedShareFormat);
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const delimiter = isiOS ? '&' : '?';
      window.location.href = `sms:${delimiter}body=${encodeURIComponent(text)}`;
    });
  }

  if (shareEmailBtn) {
    shareEmailBtn.addEventListener('click', () => {
      const text = generateShareMessage(selectedShareFormat);
      const subject = `Baseball Score: ${homeTeamName} vs ${awayTeamName}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', () => {
      const text = generateShareMessage(selectedShareFormat);
      copyTextToClipboard(text, shareCopyBtn);
    });
  }

  // Initial renders
  updateInningDisplay();
  updateOutsDisplay();
  updateTimerUI();
  updateSharePreview();
});

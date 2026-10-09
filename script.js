// script.js - Clean, Modern Mobile Baseball Scorekeeper

document.addEventListener('DOMContentLoaded', () => {
  // --- Game State Variables ---
  let homeScoreVal = 0;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true; // true = Top (Away bats), false = Bottom (Home bats)
  let currentOuts = 0;
  let secondsElapsed = 0;
  let isTimerRunning = false;
  let timerInterval = null;

  let homeTeamName = localStorage.getItem('baseball_home_team') || 'Home';
  let awayTeamName = localStorage.getItem('baseball_away_team') || 'Away';
  let selectedShareFormat = 'basic'; // 'basic', 'standard', 'broadcast'
  let currentTheme = localStorage.getItem('baseball_theme') || 'light';
  let hapticsEnabled = localStorage.getItem('baseball_haptics_enabled') !== 'false';

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
  const hapticToggle = document.getElementById('haptic-toggle');
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
  const shareNativeBtn = document.getElementById('share-native-btn');
  const shareSmsBtn = document.getElementById('share-sms-btn');
  const shareEmailBtn = document.getElementById('share-email-btn');
  const shareCopyBtn = document.getElementById('share-copy-btn');

  // Advanced Tools Elements
  const advancedToolsBtn = document.getElementById('advanced-tools-btn');
  const advancedBackdrop = document.getElementById('advanced-backdrop');
  const closeAdvancedBtn = document.getElementById('close-advanced-btn');

  // Timeouts & Tracking
  let sideChangeTimeout = null;
  let toastHideTimeout = null;

  // --- Haptic Feedback Helper ---
  function triggerHaptic(pattern = 20) {
    if (hapticsEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  if (hapticToggle) {
    hapticToggle.checked = hapticsEnabled;
    hapticToggle.addEventListener('change', () => {
      hapticsEnabled = hapticToggle.checked;
      localStorage.setItem('baseball_haptics_enabled', String(hapticsEnabled));
      if (hapticsEnabled) triggerHaptic(30);
    });
  }

  // --- Visual Feedback & Toast Utilities ---
  function triggerPop(element) {
    if (!element) return;
    element.classList.remove('pop-feedback');
    void element.offsetWidth; // Force DOM reflow
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

  // --- Dynamic Team Names Sizing (Prevent Overflows) ---
  function fitTeamNames() {
    if (!homeLabelEl || !awayLabelEl) return;
    const maxLen = Math.max(homeTeamName.length, awayTeamName.length);

    homeLabelEl.classList.remove('compact', 'ultra-compact');
    awayLabelEl.classList.remove('compact', 'ultra-compact');

    if (maxLen >= 11) {
      homeLabelEl.classList.add('ultra-compact');
      awayLabelEl.classList.add('ultra-compact');
    } else if (maxLen >= 7) {
      homeLabelEl.classList.add('compact');
      awayLabelEl.classList.add('compact');
    }

    requestAnimationFrame(updateUnderlinePosition);
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

  window.addEventListener('resize', () => {
    fitTeamNames();
    updateUnderlinePosition();
  });
  setTimeout(fitTeamNames, 60);
  setTimeout(updateUnderlinePosition, 100);
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
    const prev = homeScoreVal;
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
    updateSharePreview();
    if (homeScoreVal !== prev) {
      triggerHaptic(20);
      return true;
    }
    return false;
  }

  function changeAwayScore(delta) {
    const prev = awayScoreVal;
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
    updateSharePreview();
    if (awayScoreVal !== prev) {
      triggerHaptic(20);
      return true;
    }
    return false;
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
    triggerHaptic(25);
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
      triggerHaptic(18);
      return true;
    }
    return false;
  }

  // --- Outs Tracker Logic ---
  function updateOutsDisplay() {
    outCircles.forEach((circle) => {
      const outNum = parseInt(circle.getAttribute('data-out'), 10);
      circle.classList.toggle('active', outNum <= currentOuts);
    });
    updateSharePreview();
  }

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
    triggerHaptic([40, 60, 40]);

    sideChangeTimeout = setTimeout(() => {
      currentOuts = 0;
      updateOutsDisplay();
      advanceHalfInning();
    }, 450);
  }

  function changeOuts(delta) {
    if (delta > 0) {
      if (currentOuts + 1 >= 3) {
        handleThreeOuts();
        return true;
      } else {
        clearTimeout(sideChangeTimeout);
        currentOuts += delta;
        triggerPop(outsContainer);
        updateOutsDisplay();
        triggerHaptic(20);
        return true;
      }
    } else {
      clearTimeout(sideChangeTimeout);
      const prev = currentOuts;
      currentOuts = Math.max(0, currentOuts + delta);
      if (currentOuts !== prev) {
        triggerPop(outsContainer);
        updateOutsDisplay();
        triggerHaptic(15);
        return true;
      }
      return false;
    }
  }

  // --- Unified Tap-And-Hold Controller ---
  // TAP: increases by 1
  // HOLD (>= 400ms): decreases by 1, and continues stepping down incrementally every 500ms
  function setupTapAndHold(element, { onIncrease, onDecrease, holdDelay = 400, stepInterval = 500, onSwipeUp, onSwipeDown, itemName = 'Item', toastTag = 'SCORE' }) {
    if (!element) return;
    let holdTimeout = null;
    let holdInterval = null;
    let isHolding = false;
    let holdCount = 0;
    let startTime = 0;
    let startY = 0;
    let movedFar = false;

    element.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      isHolding = false;
      movedFar = false;
      holdCount = 0;
      startTime = Date.now();
      startY = e.clientY;

      clearTimeout(holdTimeout);
      clearInterval(holdInterval);

      holdTimeout = setTimeout(() => {
        isHolding = true;
        const couldDec = onDecrease();
        if (couldDec !== false) {
          holdCount = 1;
          showInningToast(toastTag, `${itemName} Removed x ${holdCount}`);
          holdInterval = setInterval(() => {
            const continueDec = onDecrease();
            if (continueDec === false) {
              clearInterval(holdInterval);
            } else {
              holdCount++;
              showInningToast(toastTag, `${itemName} Removed x ${holdCount}`);
            }
          }, stepInterval);
        }
      }, holdDelay);

      if (typeof element.setPointerCapture === 'function') {
        try { element.setPointerCapture(e.pointerId); } catch (_) {}
      }
    });

    element.addEventListener('pointermove', (e) => {
      const diffY = e.clientY - startY;
      if (Math.abs(diffY) > 20) {
        movedFar = true;
      }
    });

    const handleEnd = (e) => {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);

      const duration = Date.now() - startTime;
      const diffY = e.clientY - startY;

      // Handle swipe if moved intentionally
      if (movedFar && Math.abs(diffY) >= 24) {
        if (diffY < 0 && onSwipeUp) {
          onSwipeUp();
          isHolding = false;
          return;
        } else if (diffY > 0 && onSwipeDown) {
          onSwipeDown();
          isHolding = false;
          return;
        }
      }

      // If it was a quick tap (not held, not dragged far)
      if (!isHolding && !movedFar && duration < holdDelay && duration > 15) {
        onIncrease();
      }
      isHolding = false;
    };

    element.addEventListener('pointerup', handleEnd);
    element.addEventListener('pointercancel', () => {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);
      isHolding = false;
    });

    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      onDecrease();
    });
  }

  // 1. Home Score: Tap = +1, Hold = slow -1 decrement
  setupTapAndHold(homeScoreEl, {
    onIncrease: () => changeHomeScore(+1),
    onDecrease: () => changeHomeScore(-1),
    onSwipeUp: () => changeHomeScore(+1),
    onSwipeDown: () => changeHomeScore(-1),
    itemName: 'Run',
    toastTag: 'HOME'
  });

  // 2. Away Score: Tap = +1, Hold = slow -1 decrement
  setupTapAndHold(awayScoreEl, {
    onIncrease: () => changeAwayScore(+1),
    onDecrease: () => changeAwayScore(-1),
    onSwipeUp: () => changeAwayScore(+1),
    onSwipeDown: () => changeAwayScore(-1),
    itemName: 'Run',
    toastTag: 'AWAY'
  });

  // 3. Inning Stepper: Tap = +1 half inning, Hold = slow -1 half inning decrement
  setupTapAndHold(inningContainer, {
    onIncrease: () => advanceHalfInning(),
    onDecrease: () => decreaseHalfInning(),
    onSwipeUp: () => advanceHalfInning(),
    onSwipeDown: () => decreaseHalfInning(),
    itemName: 'Half-Inning',
    toastTag: 'INNING'
  });

  // 4. Outs Container: Tap anywhere = +1 Out, Hold = slow -1 decrement
  setupTapAndHold(outsContainer, {
    onIncrease: () => changeOuts(+1),
    onDecrease: () => changeOuts(-1),
    onSwipeUp: () => changeOuts(+1),
    onSwipeDown: () => changeOuts(-1),
    itemName: 'Out',
    toastTag: 'OUTS'
  });

  // Tapping Home or Away team label swaps batting side
  if (homeLabelEl) {
    homeLabelEl.addEventListener('click', () => {
      if (isTopInning) {
        clearTimeout(sideChangeTimeout);
        isTopInning = false;
        triggerPop(homeLabelEl);
        updateInningDisplay();
        triggerHaptic(20);
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
        triggerHaptic(20);
      }
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
      // When running: SHOW pause icon (clicking will pause)
      // When paused: SHOW play icon (clicking will resume/play)
      timerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerIcon) {
      modalTimerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerText) {
      modalTimerText.textContent = isTimerRunning ? 'Pause Clock' : 'Start Clock';
    }
  }

  function toggleTimer() {
    isTimerRunning = !isTimerRunning;
    updateTimerUI();
    showInningToast('CLOCK', isTimerRunning ? 'STARTED' : 'PAUSED');
    triggerHaptic(20);
  }

  function resetTimer() {
    secondsElapsed = 0;
    isTimerRunning = false; // Paused by default when resetting clock
    if (timerEl) {
      timerEl.textContent = formatTime(0);
      triggerPop(timerDisplay);
    }
    updateTimerUI();
    showInningToast('CLOCK', 'RESET (00:00:00)');
    updateSharePreview();
    triggerHaptic([30, 40]);
  }

  startTimer();

  if (timerDisplay) {
    timerDisplay.addEventListener('click', toggleTimer);
    timerDisplay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // --- Circular Magnifying Glass Theme Transition (Slow & Smooth) ---
  // Like placing a magnifying glass over the picture: the expanding circular lens reveals
  // the entire application in the new theme wherever it touches, with old theme everywhere else
  function applyThemeWithCircularPaint(newTheme) {
    if (currentTheme === newTheme) return;

    triggerHaptic(30);

    // Create the expanding magnifying glass rim ring at screen center
    const ring = document.createElement('div');
    ring.className = 'theme-magnifier-ring';
    document.body.appendChild(ring);
    setTimeout(() => {
      ring.remove();
    }, 1400);

    // Modern View Transitions API (Chrome, Edge, Safari 18+)
    if (typeof document.startViewTransition === 'function') {
      try {
        const transition = document.startViewTransition(() => {
          document.body.setAttribute('data-theme', newTheme);
          currentTheme = newTheme;
          localStorage.setItem('baseball_theme', newTheme);

          themeCards.forEach((c) => c.classList.toggle('active', c.getAttribute('data-theme') === newTheme));
          updateUnderlinePosition();
          fitTeamNames();
        });

        transition.finished.catch(() => {});
        return;
      } catch (_) {
        // Fallback to clone overlay if View Transition throws
      }
    }

    // High-fidelity DOM Clone Fallback (works in all webviews / browsers):
    // Clones the application inside an overlay with data-theme="newTheme",
    // expanding outward with circular clip-path like a magnifying lens.
    const overlay = document.createElement('div');
    overlay.className = 'theme-magnifier-clone-overlay';
    overlay.setAttribute('data-theme', newTheme);

    const container = document.querySelector('.scoreboard-container');
    if (container) {
      const clone = container.cloneNode(true);
      // Synchronize input fields in clone
      const cloneHome = clone.querySelector('#home-name-input');
      const cloneAway = clone.querySelector('#away-name-input');
      if (cloneHome && homeNameInput) cloneHome.value = homeNameInput.value;
      if (cloneAway && awayNameInput) cloneAway.value = awayNameInput.value;
      // Synchronize active theme card in clone
      clone.querySelectorAll('.theme-card').forEach((c) => {
        c.classList.toggle('active', c.getAttribute('data-theme') === newTheme);
      });
      overlay.appendChild(clone);
    }

    document.body.appendChild(overlay);

    const anim = overlay.animate([
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(160vmax at 50% 50%)' }
    ], {
      duration: 1350,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    });

    anim.onfinish = () => {
      document.body.setAttribute('data-theme', newTheme);
      currentTheme = newTheme;
      localStorage.setItem('baseball_theme', newTheme);

      themeCards.forEach((c) => c.classList.toggle('active', c.getAttribute('data-theme') === newTheme));
      updateUnderlinePosition();
      fitTeamNames();
      overlay.remove();
    };
  }

  // --- Settings Drawer ---
  function openSettings() {
    if (!settingsBackdrop) return;
    if (homeNameInput) homeNameInput.value = homeTeamName;
    if (awayNameInput) awayNameInput.value = awayTeamName;
    settingsBackdrop.classList.add('open');
    settingsBackdrop.setAttribute('aria-hidden', 'false');
    updateTimerUI();
    triggerHaptic(20);
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
      applyThemeWithCircularPaint(theme);
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
      fitTeamNames();
      updateSharePreview();
    });
  }

  if (awayNameInput) {
    awayNameInput.addEventListener('input', () => {
      awayTeamName = awayNameInput.value.trim() || 'Away';
      if (awayLabelEl) awayLabelEl.textContent = awayTeamName;
      localStorage.setItem('baseball_away_team', awayTeamName);
      fitTeamNames();
      updateSharePreview();
    });
  }

  if (homeLabelEl) homeLabelEl.textContent = homeTeamName;
  if (awayLabelEl) awayLabelEl.textContent = awayTeamName;
  fitTeamNames();

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
      triggerHaptic([30, 30]);
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
      isTimerRunning = false;

      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      if (timerEl) timerEl.textContent = formatTime(0);

      clearTimeout(sideChangeTimeout);
      updateInningDisplay();
      updateOutsDisplay();
      updateTimerUI();
      showInningToast('GAME', 'NEW GAME STARTED');
      triggerHaptic([40, 50, 40]);
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

  // --- Share Drawer Actions ---
  function openShareMenu() {
    if (!shareBackdrop) return;
    updateSharePreview();
    shareBackdrop.classList.add('open');
    shareBackdrop.setAttribute('aria-hidden', 'false');
    triggerHaptic(20);
  }

  function closeShareMenu() {
    if (!shareBackdrop) return;
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

  // --- Advanced Tools Drawer ---
  function openAdvancedTools() {
    if (!advancedBackdrop) return;
    selectedHitTeam = isTopInning ? 'Away' : 'Home';
    updateHitContextUI();
    renderHitList();
    advancedBackdrop.classList.add('open');
    advancedBackdrop.setAttribute('aria-hidden', 'false');
    setTimeout(updateStadiumScale, 60);
    triggerHaptic(20);
  }

  function closeAdvancedTools() {
    if (!advancedBackdrop) return;
    advancedBackdrop.classList.remove('open');
    advancedBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (advancedToolsBtn) {
    advancedToolsBtn.addEventListener('click', openAdvancedTools);
  }

  if (closeAdvancedBtn) {
    closeAdvancedBtn.addEventListener('click', closeAdvancedTools);
  }

  if (advancedBackdrop) {
    advancedBackdrop.addEventListener('click', (e) => {
      if (e.target === advancedBackdrop) closeAdvancedTools();
    });
  }

  // --- Canvas Instructure Style Modules (Dropdown Functionality) ---
  const canvasModules = document.querySelectorAll('.canvas-module');
  canvasModules.forEach((mod) => {
    const header = mod.querySelector('.module-header');
    const body = mod.querySelector('.module-body');
    const chevron = mod.querySelector('.module-chevron');
    if (header && body) {
      header.addEventListener('click', () => {
        const isOpen = mod.classList.contains('open');
        if (isOpen) {
          mod.classList.remove('open');
          mod.classList.add('collapsed');
          body.style.display = 'none';
          header.setAttribute('aria-expanded', 'false');
          if (chevron) {
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-right');
          }
        } else {
          mod.classList.add('open');
          mod.classList.remove('collapsed');
          body.style.display = 'flex';
          header.setAttribute('aria-expanded', 'true');
          if (chevron) {
            chevron.classList.remove('fa-chevron-right');
            chevron.classList.add('fa-chevron-down');
          }
          if (mod.id === 'module-hit-log') {
            setTimeout(updateStadiumScale, 50);
          }
        }
        triggerHaptic(15);
      });
    }
  });

  // --- Hit Log Tool (Minimalist Bleacher Scorekeeper) ---
  const hitTeamAwayBtn = document.getElementById('hit-team-away');
  const hitTeamHomeBtn = document.getElementById('hit-team-home');
  const hitCurrentInningChip = document.getElementById('hit-current-inning-chip');
  const hitPlayerInput = document.getElementById('hit-player-input');
  const hitOutcomeSelect = document.getElementById('hit-outcome-select');
  const stadiumViewport = document.getElementById('stadium-viewport');
  const stadiumEl = document.getElementById('stadium');
  const stadiumHitMarker = document.getElementById('stadium-hit-marker');
  const hitLocationTag = document.getElementById('hit-location-tag');
  const logHitSubmitBtn = document.getElementById('log-hit-submit-btn');
  const loggedHitsList = document.getElementById('logged-hits-list');
  const clearHitsBtn = document.getElementById('clear-hits-btn');
  const hitLogBadge = document.getElementById('hit-log-badge');
  const bleacherNotesInput = document.getElementById('bleacher-notes-input');

  let selectedHitTeam = isTopInning ? 'Away' : 'Home';
  let currentHitLocation = { x: 485, y: 440, name: 'Center Field' };
  let hitLogData = [];
  try {
    hitLogData = JSON.parse(localStorage.getItem('baseball_hit_log') || '[]');
  } catch (_) {
    hitLogData = [];
  }

  function updateHitContextUI() {
    if (hitTeamAwayBtn && hitTeamHomeBtn) {
      hitTeamAwayBtn.textContent = awayTeamName;
      hitTeamHomeBtn.textContent = homeTeamName;
      hitTeamAwayBtn.classList.toggle('active', selectedHitTeam === 'Away');
      hitTeamHomeBtn.classList.toggle('active', selectedHitTeam === 'Home');
    }
    if (hitCurrentInningChip) {
      hitCurrentInningChip.textContent = `${isTopInning ? 'Top' : 'Bot'} ${currentInning}`;
    }
  }

  if (hitTeamAwayBtn) {
    hitTeamAwayBtn.addEventListener('click', () => {
      selectedHitTeam = 'Away';
      updateHitContextUI();
      triggerHaptic(15);
    });
  }

  if (hitTeamHomeBtn) {
    hitTeamHomeBtn.addEventListener('click', () => {
      selectedHitTeam = 'Home';
      updateHitContextUI();
      triggerHaptic(15);
    });
  }

  function updateStadiumScale() {
    if (!stadiumViewport || !stadiumEl) return;
    const vpWidth = stadiumViewport.clientWidth;
    if (vpWidth === 0) return;
    const scale = Math.min(0.42, Math.max(0.28, (vpWidth - 8) / 980));
    stadiumEl.style.transform = `translateX(-50%) scale(${scale})`;
    stadiumEl.dataset.scale = String(scale);
  }

  window.addEventListener('resize', updateStadiumScale);

  function calculateHitZone(x, y) {
    const homeX = 485;
    const homeY = 678;
    const dist = Math.hypot(x - homeX, y - homeY);

    if (dist < 150) {
      return 'Infield (Around Plate / Pitcher)';
    } else if (dist < 340) {
      if (x < 420) return 'Infield (Third Base / 3B-SS)';
      if (x > 550) return 'Infield (First Base / 1B-2B)';
      return 'Infield (Behind 2nd Base)';
    } else {
      const isDeep = dist > 490 ? 'Deep ' : '';
      if (x < 400) return `${isDeep}Left Field (LF)`;
      if (x > 570) return `${isDeep}Right Field (RF)`;
      return `${isDeep}Center Field (CF)`;
    }
  }

  function placeHitPin(x, y) {
    const clampedX = Math.max(80, Math.min(900, Math.round(x)));
    const clampedY = Math.max(30, Math.min(710, Math.round(y)));
    const zoneName = calculateHitZone(clampedX, clampedY);

    currentHitLocation = {
      x: clampedX,
      y: clampedY,
      name: zoneName
    };

    if (stadiumHitMarker) {
      stadiumHitMarker.style.display = 'block';
      stadiumHitMarker.style.left = `${clampedX}px`;
      stadiumHitMarker.style.top = `${clampedY}px`;
    }
    if (hitLocationTag) {
      hitLocationTag.textContent = zoneName;
    }
    triggerHaptic(20);
  }

  // Initial pin position
  placeHitPin(485, 410);

  if (stadiumViewport) {
    stadiumViewport.addEventListener('pointerdown', (e) => {
      const rect = stadiumViewport.getBoundingClientRect();
      const scale = parseFloat(stadiumEl ? stadiumEl.dataset.scale : '0.34') || 0.34;
      const vpCenterX = rect.left + rect.width / 2;
      const stadiumCenterX = 490;
      const clickDistFromCenterX = (e.clientX - vpCenterX) / scale;
      const x = stadiumCenterX + clickDistFromCenterX;
      const y = (e.clientY - rect.top - 6) / scale;

      placeHitPin(x, y);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderHitList() {
    if (!loggedHitsList) return;
    if (hitLogBadge) {
      hitLogBadge.textContent = `${hitLogData.length} Logged`;
    }

    if (hitLogData.length === 0) {
      loggedHitsList.innerHTML = `<div class="hit-empty-hint">No hits logged yet. Tap the diamond and save your first play!</div>`;
      return;
    }

    loggedHitsList.innerHTML = '';
    hitLogData.forEach((hit) => {
      const card = document.createElement('div');
      card.className = 'logged-hit-card';

      let outcomeCls = 'out';
      const outcLower = hit.outcome.toLowerCase();
      if (outcLower.includes('single')) outcomeCls = 'single';
      else if (outcLower.includes('double')) outcomeCls = 'double';
      else if (outcLower.includes('triple')) outcomeCls = 'triple';
      else if (outcLower.includes('home run')) outcomeCls = 'hr';

      card.innerHTML = `
        <div class="hit-card-left">
          <span class="hit-player-name">${escapeHtml(hit.player)}</span>
          <div class="hit-meta-info">
            <span>${escapeHtml(hit.teamName || hit.team)}</span>
            <span>•</span>
            <span>${escapeHtml(hit.inning)}</span>
            <span>•</span>
            <span>${escapeHtml(hit.location)}</span>
          </div>
        </div>
        <div class="hit-card-right">
          <span class="hit-outcome-badge ${outcomeCls}">${escapeHtml(hit.outcome)}</span>
          <button type="button" class="delete-hit-btn" title="Delete hit" data-id="${hit.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      const deleteBtn = card.querySelector('.delete-hit-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteHit(hit.id);
        });
      }

      loggedHitsList.appendChild(card);
    });
  }

  function deleteHit(id) {
    hitLogData = hitLogData.filter((h) => h.id !== id);
    localStorage.setItem('baseball_hit_log', JSON.stringify(hitLogData));
    renderHitList();
    showInningToast('HIT LOG', 'Entry Removed');
    triggerHaptic(20);
  }

  if (clearHitsBtn) {
    clearHitsBtn.addEventListener('click', () => {
      if (hitLogData.length === 0) return;
      hitLogData = [];
      localStorage.setItem('baseball_hit_log', JSON.stringify(hitLogData));
      renderHitList();
      showInningToast('HIT LOG', 'All Entries Cleared');
      triggerHaptic([30, 30]);
    });
  }

  if (logHitSubmitBtn) {
    logHitSubmitBtn.addEventListener('click', () => {
      const activeTeamName = selectedHitTeam === 'Home' ? homeTeamName : awayTeamName;
      const rawPlayer = hitPlayerInput ? hitPlayerInput.value.trim() : '';
      const playerText = rawPlayer || `${activeTeamName} Batter`;
      const outcomeText = hitOutcomeSelect ? hitOutcomeSelect.value : 'Single';

      const newHit = {
        id: Date.now(),
        player: playerText,
        outcome: outcomeText,
        location: currentHitLocation.name,
        team: selectedHitTeam,
        teamName: activeTeamName,
        inning: `${isTopInning ? 'Top' : 'Bot'} ${currentInning}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        x: currentHitLocation.x,
        y: currentHitLocation.y
      };

      hitLogData.unshift(newHit);
      localStorage.setItem('baseball_hit_log', JSON.stringify(hitLogData));
      renderHitList();

      showInningToast('HIT LOG', `${playerText} (${outcomeText})`);
      triggerHaptic([30, 40]);

      if (hitPlayerInput) {
        hitPlayerInput.value = '';
      }
    });
  }

  // Bleacher Notes Input
  if (bleacherNotesInput) {
    bleacherNotesInput.value = localStorage.getItem('baseball_bleacher_notes') || '';
    bleacherNotesInput.addEventListener('input', () => {
      localStorage.setItem('baseball_bleacher_notes', bleacherNotesInput.value);
    });
  }

  // Render initial hits on load
  renderHitList();
  updateHitContextUI();

  // Escape Key to close any active drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shareBackdrop && shareBackdrop.classList.contains('open')) closeShareMenu();
      if (settingsBackdrop && settingsBackdrop.classList.contains('open')) closeSettings();
      if (advancedBackdrop && advancedBackdrop.classList.contains('open')) closeAdvancedTools();
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
      triggerHaptic(20);
    });
  });

  // Copy Preview Button
  function copyTextToClipboard(text, btnElement) {
    const doFeedback = () => {
      showInningToast('COPIED', 'Score copied to clipboard');
      triggerHaptic(30);
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
      triggerHaptic(20);
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
      triggerHaptic(20);
      const text = generateShareMessage(selectedShareFormat);
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const delimiter = isiOS ? '&' : '?';
      window.location.href = `sms:${delimiter}body=${encodeURIComponent(text)}`;
    });
  }

  if (shareEmailBtn) {
    shareEmailBtn.addEventListener('click', () => {
      triggerHaptic(20);
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

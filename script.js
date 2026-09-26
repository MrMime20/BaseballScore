// script.js - Baseball Scorekeeper with Themes, Sliding Underline & Smooth Gestures

document.addEventListener('DOMContentLoaded', () => {
  // Game State
  let homeScoreVal = 4;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true;
  let currentOuts = 0;
  let homeTeamName = 'Home';
  let awayTeamName = 'Away';

  // Timer State
  let secondsElapsed = 0;
  let isTimerRunning = true;
  let timerInterval = null;

  // DOM Elements - Scores & Teams
  const homeScoreEl = document.getElementById('home-score');
  const awayScoreEl = document.getElementById('away-score');
  const homeLabelEl = document.getElementById('home-label');
  const awayLabelEl = document.getElementById('away-label');
  const teamLabelsContainer = document.getElementById('team-labels-container');
  const battingUnderline = document.getElementById('batting-underline');

  // DOM Elements - Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerEl = document.getElementById('timer');
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerIcon = document.getElementById('timer-icon');

  // DOM Elements - Inning & Half Arrows
  const inningValEl = document.getElementById('inning-val');
  const inningUpBtn = document.getElementById('inning-up');
  const inningDownBtn = document.getElementById('inning-down');
  const inningContainer = document.getElementById('inning-container');

  // DOM Elements - Outs Tracker
  const outsContainer = document.getElementById('outs-container');
  const outCircles = document.querySelectorAll('.out-circle');

  // DOM Elements - Settings Modal & Drawer
  const settingsBtn = document.getElementById('settings-btn');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const settingsDrawer = document.getElementById('settings-drawer');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const shareBtn = document.getElementById('share-btn');
  const themeCards = document.querySelectorAll('.theme-card');
  const homeNameInput = document.getElementById('home-name-input');
  const awayNameInput = document.getElementById('away-name-input');
  const modalTimerToggleBtn = document.getElementById('modal-timer-toggle-btn');
  const modalTimerResetBtn = document.getElementById('modal-timer-reset-btn');
  const modalTimerIcon = document.getElementById('modal-timer-icon');
  const modalTimerText = document.getElementById('modal-timer-text');
  const clearRunsBtn = document.getElementById('clear-runs-btn');
  const resetGameBtn = document.getElementById('reset-game-btn');

  // Timeouts
  let sideChangeTimeout = null;
  let toastHideTimeout = null;

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
    }, 1700);
  }

  // --- Smooth Sliding Underline Positioner ---
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

  // Recalculate underline on resize & font loads
  window.addEventListener('resize', updateUnderlinePosition);
  setTimeout(updateUnderlinePosition, 100);
  setTimeout(updateUnderlinePosition, 400);

  // --- Automatic 3-Outs Side Change Logic ---
  function handleThreeOuts() {
    clearTimeout(sideChangeTimeout);

    // 1. Immediately light up all 3 outs
    currentOuts = 3;
    updateOutsDisplay();

    // 2. Visual flash animation on the outs container
    if (outsContainer) {
      outsContainer.classList.remove('flash-3outs');
      void outsContainer.offsetWidth;
      outsContainer.classList.add('flash-3outs');
    }

    // 3. Prepare visual toast notification describing the change
    showInningToast('3 OUTS', 'CHANGE SIDES');

    // 4. Brief pause (450ms) so user sees 3 outs registered, then advance side and reset outs
    sideChangeTimeout = setTimeout(() => {
      currentOuts = 0;
      updateOutsDisplay();

      if (isTopInning) {
        // Top of inning -> Bottom of same inning
        isTopInning = false;
      } else {
        // Bottom of inning -> Top of next inning
        currentInning++;
        isTopInning = true;
      }

      updateInningDisplay();

      // Pulse animation on inning container to highlight new state
      if (inningContainer) {
        inningContainer.classList.remove('pulse-transition');
        void inningContainer.offsetWidth;
        inningContainer.classList.add('pulse-transition');
      }
    }, 450);
  }

  // --- Inning & Top/Bottom Display Logic ---
  function updateInningDisplay() {
    if (inningValEl) {
      inningValEl.textContent = currentInning;
    }

    // Highlight top arrow for Top of inning, bottom arrow for Bottom of inning
    if (inningUpBtn) {
      inningUpBtn.classList.toggle('active', isTopInning);
      inningUpBtn.setAttribute('aria-pressed', isTopInning ? 'true' : 'false');
      inningUpBtn.title = isTopInning ? 'Top of Inning (active) - click to +1 Inning' : 'Click to set Top of Inning';
    }
    if (inningDownBtn) {
      inningDownBtn.classList.toggle('active', !isTopInning);
      inningDownBtn.setAttribute('aria-pressed', !isTopInning ? 'true' : 'false');
      inningDownBtn.title = !isTopInning ? 'Bottom of Inning (active) - click to -1 Inning' : 'Click to set Bottom of Inning';
    }

    // Batting indicator: Away bats in Top, Home bats in Bottom
    if (awayLabelEl && homeLabelEl) {
      awayLabelEl.classList.toggle('batting', isTopInning);
      homeLabelEl.classList.toggle('batting', !isTopInning);
    }

    // Smoothly slide the underline across
    requestAnimationFrame(updateUnderlinePosition);
  }

  function incrementInning() {
    clearTimeout(sideChangeTimeout);
    currentInning++;
    triggerPop(inningValEl);
    updateInningDisplay();
  }

  function decrementInning() {
    clearTimeout(sideChangeTimeout);
    if (currentInning > 1) {
      currentInning--;
      triggerPop(inningValEl);
      updateInningDisplay();
    }
  }

  function toggleInningHalf() {
    clearTimeout(sideChangeTimeout);
    isTopInning = !isTopInning;
    triggerPop(isTopInning ? inningUpBtn : inningDownBtn);
    updateInningDisplay();
  }

  function setInningHalf(toTop) {
    clearTimeout(sideChangeTimeout);
    if (isTopInning === toTop) {
      // If clicking already active arrow, advance/decrement inning number
      if (toTop) {
        incrementInning();
      } else {
        decrementInning();
      }
    } else {
      isTopInning = toTop;
      triggerPop(toTop ? inningUpBtn : inningDownBtn);
      updateInningDisplay();
    }
  }

  // Arrow button click listeners
  if (inningUpBtn) {
    inningUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setInningHalf(true);
    });
  }

  if (inningDownBtn) {
    inningDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setInningHalf(false);
    });
  }

  // Clicking team names toggles offense/half directly
  if (homeLabelEl) {
    homeLabelEl.addEventListener('click', () => {
      setInningHalf(false); // Bottom of inning (Home bats)
    });
  }
  if (awayLabelEl) {
    awayLabelEl.addEventListener('click', () => {
      setInningHalf(true); // Top of inning (Away bats)
    });
  }

  // --- Runs (Score) Modification Logic ---
  function changeHomeScore(delta) {
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
  }

  function changeAwayScore(delta) {
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
  }

  // Contextmenu (right-click) to remove runs / innings / outs
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

  if (inningValEl) {
    inningValEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      decrementInning();
    });
  }

  if (outsContainer) {
    outsContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      changeOuts(-1);
    });
  }

  // --- Outs Tracker Logic ---
  function updateOutsDisplay() {
    outCircles.forEach((circle) => {
      const outNum = parseInt(circle.getAttribute('data-out'), 10);
      circle.classList.toggle('active', outNum <= currentOuts);
    });
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

  // Individual out circle clicks
  outCircles.forEach((circle) => {
    circle.addEventListener('click', (e) => {
      e.stopPropagation();
      const clickedOut = parseInt(circle.getAttribute('data-out'), 10);
      if (currentOuts === clickedOut) {
        clearTimeout(sideChangeTimeout);
        currentOuts = clickedOut - 1; // Click active out to turn it off
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

  // --- Universal Touch & Mouse Swipe Gesture Detector ---
  function setupSwipeGestures(element, { onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap }) {
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
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        moved = true;
      }
    });

    const handlePointerEnd = (e) => {
      if (!isTracking) return;
      isTracking = false;

      const diffX = e.clientX - startX;
      const diffY = e.clientY - startY;
      const elapsed = Date.now() - startTime;
      const threshold = 18; // px

      if (Math.abs(diffY) >= threshold && Math.abs(diffY) >= Math.abs(diffX)) {
        if (diffY < 0 && onSwipeUp) {
          onSwipeUp();
          return;
        } else if (diffY > 0 && onSwipeDown) {
          onSwipeDown();
          return;
        }
      } else if (Math.abs(diffX) >= threshold && Math.abs(diffX) >= Math.abs(diffY)) {
        if (diffX < 0 && onSwipeLeft) {
          onSwipeLeft();
          return;
        } else if (diffX > 0 && onSwipeRight) {
          onSwipeRight();
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

  // --- Attach Gestures to Components ---
  setupSwipeGestures(homeScoreEl, {
    onSwipeUp: () => changeHomeScore(+1),
    onSwipeDown: () => changeHomeScore(-1),
    onTap: () => changeHomeScore(+1),
  });

  setupSwipeGestures(awayScoreEl, {
    onSwipeUp: () => changeAwayScore(+1),
    onSwipeDown: () => changeAwayScore(-1),
    onTap: () => changeAwayScore(+1),
  });

  setupSwipeGestures(inningContainer, {
    onSwipeUp: () => incrementInning(),
    onSwipeDown: () => decrementInning(),
    onSwipeLeft: () => toggleInningHalf(),
    onSwipeRight: () => toggleInningHalf(),
    onTap: (e) => {
      if (!e.target.closest('.arrow-btn')) {
        incrementInning();
      }
    },
  });

  setupSwipeGestures(outsContainer, {
    onSwipeUp: () => changeOuts(+1),
    onSwipeRight: () => changeOuts(+1),
    onSwipeDown: () => changeOuts(-1),
    onSwipeLeft: () => changeOuts(-1),
    onTap: (e) => {
      if (!e.target.closest('.out-circle')) {
        changeOuts(+1);
      }
    },
  });

  // --- Stopwatch Timer Controls (Pause & Reset) ---
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

  function toggleTimer() {
    isTimerRunning = !isTimerRunning;
    if (timerDisplay) {
      timerDisplay.classList.toggle('paused', !isTimerRunning);
    }
    if (timerIcon) {
      timerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerIcon) {
      modalTimerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
    if (modalTimerText) {
      modalTimerText.textContent = isTimerRunning ? 'Pause Clock' : 'Resume Clock';
    }
    showInningToast('CLOCK', isTimerRunning ? 'RESUMED' : 'PAUSED');
  }

  function resetTimer() {
    secondsElapsed = 0;
    if (timerEl) {
      timerEl.textContent = formatTime(0);
      triggerPop(timerDisplay);
    }
    showInningToast('CLOCK', 'RESET (00:00:00)');
  }

  startTimer();

  if (timerToggleBtn) {
    timerToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTimer();
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      resetTimer();
    });
  }

  // Tapping timer body toggles pause/resume; swipe down resets
  setupSwipeGestures(timerDisplay, {
    onSwipeDown: () => resetTimer(),
    onTap: (e) => {
      if (!e.target.closest('.timer-btn')) {
        toggleTimer();
      }
    },
  });

  if (timerDisplay) {
    timerDisplay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // --- Settings Menu Rollout & Modal Management ---
  function openSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.add('open');
    settingsBackdrop.setAttribute('aria-hidden', 'false');
    if (settingsBtn) {
      settingsBtn.classList.add('spinning');
      setTimeout(() => settingsBtn.classList.remove('spinning'), 500);
    }
    // Sync modal timer state
    if (modalTimerText) {
      modalTimerText.textContent = isTimerRunning ? 'Pause Clock' : 'Resume Clock';
    }
    if (modalTimerIcon) {
      modalTimerIcon.className = isTimerRunning ? 'fa-solid fa-pause' : 'fa-solid fa-play';
    }
  }

  function closeSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.remove('open');
    settingsBackdrop.setAttribute('aria-hidden', 'true');
    // Ensure underline repositioned
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
      if (e.target === settingsBackdrop) {
        closeSettings();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsBackdrop && settingsBackdrop.classList.contains('open')) {
      closeSettings();
    }
  });

  // Modal timer buttons
  if (modalTimerToggleBtn) {
    modalTimerToggleBtn.addEventListener('click', () => {
      toggleTimer();
    });
  }

  if (modalTimerResetBtn) {
    modalTimerResetBtn.addEventListener('click', () => {
      resetTimer();
    });
  }

  // --- Theme Management ---
  function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('baseball_theme', themeName);

    themeCards.forEach((card) => {
      const isCardActive = card.getAttribute('data-theme') === themeName;
      card.classList.toggle('active', isCardActive);
    });

    // Animate underline to fit theme colors smoothly
    requestAnimationFrame(updateUnderlinePosition);
  }

  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      if (theme) applyTheme(theme);
    });
  });

  // Load saved theme or default
  const savedTheme = localStorage.getItem('baseball_theme') || 'light';
  applyTheme(savedTheme);

  // --- Team Name Inputs ---
  if (homeNameInput) {
    homeNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Home';
      homeTeamName = val;
      if (homeLabelEl) homeLabelEl.textContent = val;
      updateUnderlinePosition();
    });
  }

  if (awayNameInput) {
    awayNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Away';
      awayTeamName = val;
      if (awayLabelEl) awayLabelEl.textContent = val;
      updateUnderlinePosition();
    });
  }

  // --- Quick Reset Actions ---
  if (clearRunsBtn) {
    clearRunsBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      triggerPop(homeScoreEl);
      triggerPop(awayScoreEl);
      showInningToast('RUNS', 'RESET (0 - 0)');
      closeSettings();
    });
  }

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

      showInningToast('GAME', 'NEW GAME STARTED');
      closeSettings();
    });
  }

  // --- Share Button ---
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const halfName = isTopInning ? 'Top' : 'Bottom';
      const shareText = `⚾ ${homeTeamName} ${homeScoreVal} - ${awayTeamName} ${awayScoreVal} (${halfName} of Inning ${currentInning}, ${currentOuts} Out${currentOuts === 1 ? '' : 's'})`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          showInningToast('COPIED', `${homeTeamName} ${homeScoreVal} - ${awayTeamName} ${awayScoreVal}`);
        }).catch(() => {
          showInningToast('SCORE', `${homeTeamName} ${homeScoreVal} - ${awayTeamName} ${awayScoreVal}`);
        });
      } else {
        showInningToast('SCORE', `${homeTeamName} ${homeScoreVal} - ${awayTeamName} ${awayScoreVal}`);
      }
    });
  }

  // --- Initial Render ---
  updateInningDisplay();
  updateOutsDisplay();
});

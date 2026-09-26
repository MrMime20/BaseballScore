// script.js - Baseball Scorekeeper with Dynamic Themes, Share Menu & Smooth Animations

document.addEventListener('DOMContentLoaded', () => {
  // Game State
  let homeScoreVal = 4;
  let awayScoreVal = 0;
  let currentInning = 1;
  let isTopInning = true;
  let currentOuts = 0;
  let homeTeamName = 'Home';
  let awayTeamName = 'Away';
  let selectedShareFormat = 'basic';

  // Box Score & Match Stats State
  let inningRuns = {
    home: [4, 0, 0, 0, 0, 0, 0, 0, 0],
    away: [0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  let teamHits = { home: 0, away: 0 };
  let teamErrors = { home: 0, away: 0 };
  let isGameFinal = false;

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

  // DOM Elements - Compact Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerEl = document.getElementById('timer');
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
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const themeCards = document.querySelectorAll('.theme-card');
  const homeNameInput = document.getElementById('home-name-input');
  const awayNameInput = document.getElementById('away-name-input');
  const modalTimerToggleBtn = document.getElementById('modal-timer-toggle-btn');
  const modalTimerResetBtn = document.getElementById('modal-timer-reset-btn');
  const modalTimerIcon = document.getElementById('modal-timer-icon');
  const modalTimerText = document.getElementById('modal-timer-text');
  const clearRunsBtn = document.getElementById('clear-runs-btn');
  const resetGameBtn = document.getElementById('reset-game-btn');

  // DOM Elements - Share Modal & Drawer
  const shareBtn = document.getElementById('share-btn');
  const shareBackdrop = document.getElementById('share-backdrop');
  const closeShareBtn = document.getElementById('close-share-btn');
  const summaryCards = document.querySelectorAll('.summary-card');
  const sharePreviewText = document.getElementById('share-preview-text');
  const copyPreviewBtn = document.getElementById('copy-preview-btn');
  const shareNativeBtn = document.getElementById('share-native-btn');
  const shareSmsBtn = document.getElementById('share-sms-btn');
  const shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
  const shareTwitterBtn = document.getElementById('share-twitter-btn');
  const shareEmailBtn = document.getElementById('share-email-btn');
  const shareCopyBtn = document.getElementById('share-copy-btn');

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

  window.addEventListener('resize', updateUnderlinePosition);
  setTimeout(updateUnderlinePosition, 100);
  setTimeout(updateUnderlinePosition, 400);

  // --- Automatic 3-Outs Side Change Logic ---
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

      if (isTopInning) {
        isTopInning = false;
      } else {
        currentInning++;
        isTopInning = true;
      }

      updateInningDisplay();

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

    if (inningUpBtn) {
      inningUpBtn.classList.toggle('active', isTopInning);
      inningUpBtn.setAttribute('aria-pressed', isTopInning ? 'true' : 'false');
      inningUpBtn.title = isTopInning ? 'Top of Inning (active) - tap to +1 Inning' : 'Tap to set Top of Inning';
    }
    if (inningDownBtn) {
      inningDownBtn.classList.toggle('active', !isTopInning);
      inningDownBtn.setAttribute('aria-pressed', !isTopInning ? 'true' : 'false');
      inningDownBtn.title = !isTopInning ? 'Bottom of Inning (active) - tap to -1 Inning' : 'Tap to set Bottom of Inning';
    }

    if (awayLabelEl && homeLabelEl) {
      awayLabelEl.classList.toggle('batting', isTopInning);
      homeLabelEl.classList.toggle('batting', !isTopInning);
    }

    requestAnimationFrame(updateUnderlinePosition);
    updateSharePreview();
    if (typeof updateHitTeamUI === 'function') {
      hitTeam = isTopInning ? 'away' : 'home';
      updateHitTeamUI();
    }
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
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

  if (homeLabelEl) {
    homeLabelEl.addEventListener('click', () => {
      setInningHalf(false);
    });
  }
  if (awayLabelEl) {
    awayLabelEl.addEventListener('click', () => {
      setInningHalf(true);
    });
  }

  // --- Runs (Score) Modification Logic ---
  function changeHomeScore(delta) {
    homeScoreVal = Math.max(0, homeScoreVal + delta);
    if (homeScoreEl) {
      homeScoreEl.textContent = homeScoreVal;
      triggerPop(homeScoreEl);
    }
    if (typeof updateInningRunsFromScore === 'function') {
      updateInningRunsFromScore('home', homeScoreVal);
    }
    updateSharePreview();
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
  }

  function changeAwayScore(delta) {
    awayScoreVal = Math.max(0, awayScoreVal + delta);
    if (awayScoreEl) {
      awayScoreEl.textContent = awayScoreVal;
      triggerPop(awayScoreEl);
    }
    if (typeof updateInningRunsFromScore === 'function') {
      updateInningRunsFromScore('away', awayScoreVal);
    }
    updateSharePreview();
    if (typeof updateRecapCard === 'function') {
      updateRecapCard();
    }
  }

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

  // --- Touch & Mouse Swipe Gesture Detector ---
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
      const threshold = 18;

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

  // Attach Gestures
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

  // --- Stopwatch Timer Controls ---
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

  // Tap on the timer pill pauses/resumes
  if (timerDisplay) {
    timerDisplay.addEventListener('click', () => {
      toggleTimer();
    });

    timerDisplay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      resetTimer();
    });
  }

  // --- Settings Menu Management ---
  function openSettings() {
    if (!settingsBackdrop) return;
    settingsBackdrop.classList.add('open');
    settingsBackdrop.setAttribute('aria-hidden', 'false');
    if (settingsBtn) {
      settingsBtn.classList.add('spinning');
      setTimeout(() => settingsBtn.classList.remove('spinning'), 500);
    }
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
      if (e.target === settingsBackdrop) {
        closeSettings();
      }
    });
  }

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

    requestAnimationFrame(updateUnderlinePosition);
  }

  themeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const theme = card.getAttribute('data-theme');
      if (theme) applyTheme(theme);
    });
  });

  const savedTheme = localStorage.getItem('baseball_theme') || 'light';
  applyTheme(savedTheme);

  // Team Names
  if (homeNameInput) {
    homeNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Home';
      homeTeamName = val;
      if (homeLabelEl) homeLabelEl.textContent = val;
      updateUnderlinePosition();
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof updateHitTeamUI === 'function') updateHitTeamUI();
      if (typeof updateRecapCard === 'function') updateRecapCard();
    });
  }

  if (awayNameInput) {
    awayNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || 'Away';
      awayTeamName = val;
      if (awayLabelEl) awayLabelEl.textContent = val;
      updateUnderlinePosition();
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof updateHitTeamUI === 'function') updateHitTeamUI();
      if (typeof updateRecapCard === 'function') updateRecapCard();
    });
  }

  // Quick Reset Actions
  if (clearRunsBtn) {
    clearRunsBtn.addEventListener('click', () => {
      homeScoreVal = 0;
      awayScoreVal = 0;
      inningRuns.home = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      inningRuns.away = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      triggerPop(homeScoreEl);
      triggerPop(awayScoreEl);
      showInningToast('RUNS', 'RESET (0 - 0)');
      updateSharePreview();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updateRecapCard === 'function') updateRecapCard();
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
      isGameFinal = false;

      inningRuns.home = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      inningRuns.away = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      teamHits.home = 0;
      teamHits.away = 0;
      teamErrors.home = 0;
      teamErrors.away = 0;

      if (typeof pitchData !== 'undefined') {
        pitchData.home = { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] };
        pitchData.away = { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] };
      }
      if (typeof hitLogEntries !== 'undefined') {
        hitLogEntries = [];
      }

      if (homeScoreEl) homeScoreEl.textContent = '0';
      if (awayScoreEl) awayScoreEl.textContent = '0';
      if (timerEl) timerEl.textContent = formatTime(0);

      clearTimeout(sideChangeTimeout);
      updateInningDisplay();
      updateOutsDisplay();

      if (typeof updatePitchDisplay === 'function') updatePitchDisplay();
      if (typeof renderHitLogList === 'function') renderHitLogList();
      if (typeof updateBoxScoreTable === 'function') updateBoxScoreTable();
      if (typeof updateRecapCard === 'function') updateRecapCard();

      showInningToast('GAME', 'NEW GAME STARTED');
      closeSettings();
    });
  }

  // --- Share Menu & Format Generation ---
  function getOrdinal(num) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function generateShareMessage(format) {
    const half = isTopInning ? 'Top' : 'Bottom';
    const outsStr = `${currentOuts} ${currentOuts === 1 ? 'Out' : 'Outs'}`;
    const timeStr = formatTime(secondsElapsed);
    const battingTeam = isTopInning ? awayTeamName : homeTeamName;

    switch (format) {
      case 'basic':
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;

      case 'standard':
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName} (${half} ${currentInning} • ${outsStr})`;

      case 'box':
        return [
          `⚾ BASEBALL SCOREBOARD`,
          `─────────────────────────`,
          `${homeTeamName}: ${homeScoreVal}`,
          `${awayTeamName}: ${awayScoreVal}`,
          `─────────────────────────`,
          `Inning:  ${half} ${currentInning}`,
          `Outs:    ${outsStr}`,
          `Time:    ${timeStr}`,
          `Batting: ${battingTeam}`
        ].join('\n');

      case 'broadcast':
        return `⚾ Live Score Update: ${homeTeamName} (${homeScoreVal}) vs ${awayTeamName} (${awayScoreVal}) in the ${half} of the ${currentInning}${getOrdinal(currentInning)} with ${outsStr}. Game clock: ${timeStr}.`;

      default:
        return `⚾ ${homeTeamName} ${homeScoreVal} - ${awayScoreVal} ${awayTeamName}`;
    }
  }

  function updateSharePreview() {
    if (!sharePreviewText) return;
    sharePreviewText.textContent = generateShareMessage(selectedShareFormat);
  }

  function openShareMenu() {
    if (!shareBackdrop) return;
    updateSharePreview();
    shareBackdrop.classList.add('open');
    shareBackdrop.setAttribute('aria-hidden', 'false');
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
      if (e.target === shareBackdrop) {
        closeShareMenu();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (shareBackdrop && shareBackdrop.classList.contains('open')) closeShareMenu();
      if (settingsBackdrop && settingsBackdrop.classList.contains('open')) closeSettings();
    }
  });

  // Summary Format Cards Selection
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

  // Copy Preview & General Copy Actions
  function copyTextToClipboard(text, btnElement) {
    const doFeedback = () => {
      showInningToast('COPIED', 'Message copied to clipboard');
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
        // Fallback for iframe restrictions
        legacyCopy(text);
        doFeedback();
      });
    } else {
      legacyCopy(text);
      doFeedback();
    }
  }

  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (_) {}
    document.body.removeChild(textarea);
  }

  if (copyPreviewBtn) {
    copyPreviewBtn.addEventListener('click', () => {
      copyTextToClipboard(generateShareMessage(selectedShareFormat), copyPreviewBtn);
    });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', () => {
      copyTextToClipboard(generateShareMessage(selectedShareFormat), shareCopyBtn);
    });
  }

  // Sharing Channels
  if (shareNativeBtn) {
    shareNativeBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      if (navigator.share) {
        navigator.share({
          title: `${homeTeamName} vs ${awayTeamName} - Baseball Score`,
          text: message,
        }).catch(() => {});
      } else {
        copyTextToClipboard(message, shareNativeBtn);
      }
    });
  }

  if (shareSmsBtn) {
    shareSmsBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const delimiter = isIOS ? '&' : '?';
      const url = `sms:${delimiter}body=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('TEXT / SMS', 'Opening Messages...');
    });
  }

  if (shareWhatsappBtn) {
    shareWhatsappBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('WHATSAPP', 'Opening WhatsApp...');
    });
  }

  if (shareTwitterBtn) {
    shareTwitterBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('X / POST', 'Opening X...');
    });
  }

  if (shareEmailBtn) {
    shareEmailBtn.addEventListener('click', () => {
      const message = generateShareMessage(selectedShareFormat);
      const subject = `Baseball Score: ${homeTeamName} vs ${awayTeamName}`;
      const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      showInningToast('EMAIL', 'Opening Email...');
    });
  }

  // =========================================================================
  // ADVANCED TOOLS CONTROLLER
  // =========================================================================

  // --- 1. Box Score Inning Runs & Errors Tracking ---
  function updateInningRunsFromScore(team, targetScore) {
    const arr = inningRuns[team];
    let currentSum = arr.reduce((a, b) => a + b, 0);
    const diff = targetScore - currentSum;

    if (diff > 0) {
      const innIdx = Math.min(Math.max(0, currentInning - 1), 8);
      arr[innIdx] += diff;
    } else if (diff < 0) {
      let toRemove = -diff;
      for (let i = Math.min(currentInning - 1, 8); i >= 0 && toRemove > 0; i--) {
        const canRemove = Math.min(arr[i], toRemove);
        arr[i] -= canRemove;
        toRemove -= canRemove;
      }
      for (let i = 8; i >= 0 && toRemove > 0; i--) {
        const canRemove = Math.min(arr[i], toRemove);
        arr[i] -= canRemove;
        toRemove -= canRemove;
      }
    }
    updateBoxScoreTable();
  }

  function updateBoxScoreTable() {
    // Away row
    const awayCells = document.querySelectorAll('#linescore-away-row .inn-cell');
    awayCells.forEach((cell) => {
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      cell.textContent = inningRuns.away[inn] ?? 0;
    });
    const boxAwayRuns = document.getElementById('box-away-runs');
    if (boxAwayRuns) boxAwayRuns.textContent = awayScoreVal;
    const boxAwayHits = document.getElementById('box-away-hits');
    if (boxAwayHits) boxAwayHits.textContent = teamHits.away;
    const boxAwayErrors = document.getElementById('box-away-errors');
    if (boxAwayErrors) boxAwayErrors.textContent = teamErrors.away;

    // Home row
    const homeCells = document.querySelectorAll('#linescore-home-row .inn-cell');
    homeCells.forEach((cell) => {
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      cell.textContent = inningRuns.home[inn] ?? 0;
    });
    const boxHomeRuns = document.getElementById('box-home-runs');
    if (boxHomeRuns) boxHomeRuns.textContent = homeScoreVal;
    const boxHomeHits = document.getElementById('box-home-hits');
    if (boxHomeHits) boxHomeHits.textContent = teamHits.home;
    const boxHomeErrors = document.getElementById('box-home-errors');
    if (boxHomeErrors) boxHomeErrors.textContent = teamErrors.home;

    // Error stepper indicators
    const errHomeVal = document.getElementById('err-home-val');
    if (errHomeVal) errHomeVal.textContent = teamErrors.home;
    const errAwayVal = document.getElementById('err-away-val');
    if (errAwayVal) errAwayVal.textContent = teamErrors.away;

    // Labels
    const linescoreAwayName = document.getElementById('linescore-away-name');
    if (linescoreAwayName) linescoreAwayName.textContent = awayTeamName;
    const linescoreHomeName = document.getElementById('linescore-home-name');
    if (linescoreHomeName) linescoreHomeName.textContent = homeTeamName;
    const errHomeLabel = document.getElementById('err-home-label');
    if (errHomeLabel) errHomeLabel.textContent = homeTeamName;
    const errAwayLabel = document.getElementById('err-away-label');
    if (errAwayLabel) errAwayLabel.textContent = awayTeamName;

    updateRecapCard();
  }

  // Interactive Inning Cell Tap/Click
  document.querySelectorAll('.inn-cell').forEach((cell) => {
    cell.addEventListener('click', () => {
      const team = cell.getAttribute('data-team');
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      inningRuns[team][inn]++;
      if (team === 'home') {
        homeScoreVal = inningRuns.home.reduce((a, b) => a + b, 0);
        if (homeScoreEl) homeScoreEl.textContent = homeScoreVal;
        triggerPop(homeScoreEl);
      } else {
        awayScoreVal = inningRuns.away.reduce((a, b) => a + b, 0);
        if (awayScoreEl) awayScoreEl.textContent = awayScoreVal;
        triggerPop(awayScoreEl);
      }
      triggerPop(cell);
      updateBoxScoreTable();
      updateSharePreview();
    });

    cell.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const team = cell.getAttribute('data-team');
      const inn = parseInt(cell.getAttribute('data-inn'), 10) - 1;
      if (inningRuns[team][inn] > 0) {
        inningRuns[team][inn]--;
        if (team === 'home') {
          homeScoreVal = inningRuns.home.reduce((a, b) => a + b, 0);
          if (homeScoreEl) homeScoreEl.textContent = homeScoreVal;
          triggerPop(homeScoreEl);
        } else {
          awayScoreVal = inningRuns.away.reduce((a, b) => a + b, 0);
          if (awayScoreEl) awayScoreEl.textContent = awayScoreVal;
          triggerPop(awayScoreEl);
        }
        triggerPop(cell);
        updateBoxScoreTable();
        updateSharePreview();
      }
    });
  });

  // Team Error Stepper controls
  const errHomeMinus = document.getElementById('err-home-minus');
  const errHomePlus = document.getElementById('err-home-plus');
  const errAwayMinus = document.getElementById('err-away-minus');
  const errAwayPlus = document.getElementById('err-away-plus');

  if (errHomeMinus) {
    errHomeMinus.addEventListener('click', () => {
      teamErrors.home = Math.max(0, teamErrors.home - 1);
      updateBoxScoreTable();
    });
  }
  if (errHomePlus) {
    errHomePlus.addEventListener('click', () => {
      teamErrors.home++;
      updateBoxScoreTable();
    });
  }
  if (errAwayMinus) {
    errAwayMinus.addEventListener('click', () => {
      teamErrors.away = Math.max(0, teamErrors.away - 1);
      updateBoxScoreTable();
    });
  }
  if (errAwayPlus) {
    errAwayPlus.addEventListener('click', () => {
      teamErrors.away++;
      updateBoxScoreTable();
    });
  }

  // --- 2. Pitch Counter Logic (Simple & Advanced, Scoreboard Integration) ---
  let pitchCounterEnabled = localStorage.getItem('pitch_counter_enabled') === 'true';
  let pitchCounterMode = localStorage.getItem('pitch_counter_mode') || 'simple'; // 'simple' or 'advanced'
  let activePitcherTeam = 'home';

  // Pitcher Names (persisted in localStorage)
  let pitcherNames = {
    home: 'Nathan Eovaldi #17',
    away: 'Yoshinobu Yamamoto #18'
  };
  try {
    const savedPitchers = JSON.parse(localStorage.getItem('pitcher_names_v2'));
    if (savedPitchers) {
      if (savedPitchers.home) pitcherNames.home = savedPitchers.home;
      if (savedPitchers.away) pitcherNames.away = savedPitchers.away;
    }
  } catch (_) {}

  function savePitcherNames() {
    try {
      localStorage.setItem('pitcher_names_v2', JSON.stringify(pitcherNames));
    } catch (_) {}
  }

  const pitchData = {
    home: { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] },
    away: { total: 0, strikes: 0, balls: 0, fouls: 0, inplay: 0, history: [] }
  };

  // Main Screen Widget DOM Elements
  const mainPitchWidget = document.getElementById('main-pitch-widget');
  const mainPitcherToggleBtn = document.getElementById('main-pitcher-toggle-btn');
  const mainPitchTeamBadge = document.getElementById('main-pitch-team-badge');
  const mainPitcherName = document.getElementById('main-pitcher-name');
  const mainPitchModePill = document.getElementById('main-pitch-mode-pill');
  const mainPitchExpandBtn = document.getElementById('main-pitch-expand-btn');
  const mainPitchSimpleView = document.getElementById('main-pitch-simple-view');
  const mainPitchAdvView = document.getElementById('main-pitch-adv-view');
  const mainPitchNumSimple = document.getElementById('main-pitch-num-simple');
  const mainPitchNumAdv = document.getElementById('main-pitch-num-adv');
  const mainSimpleAddBtn = document.getElementById('main-simple-add-btn');
  const mainSimpleUndoBtn = document.getElementById('main-simple-undo-btn');
  const mainAdvStrikes = document.getElementById('main-adv-strikes');
  const mainAdvBalls = document.getElementById('main-adv-balls');
  const mainAdvPct = document.getElementById('main-adv-pct');
  const mainAdvBtnStrike = document.getElementById('main-adv-btn-strike');
  const mainAdvBtnBall = document.getElementById('main-adv-btn-ball');
  const mainAdvBtnFoul = document.getElementById('main-adv-btn-foul');
  const mainAdvBtnInplay = document.getElementById('main-adv-btn-inplay');
  const mainAdvBtnUndo = document.getElementById('main-adv-btn-undo');

  // Drawer Panel Pitch Elements
  const togglePitchScoreboard = document.getElementById('toggle-pitch-scoreboard');
  const settingsPitchScoreboardToggle = document.getElementById('settings-pitch-scoreboard-toggle');
  const pitchModeSimpleBtn = document.getElementById('pitch-mode-simple-btn');
  const pitchModeAdvBtn = document.getElementById('pitch-mode-adv-btn');
  const settingsPitchModeSimple = document.getElementById('settings-pitch-mode-simple');
  const settingsPitchModeAdv = document.getElementById('settings-pitch-mode-adv');
  const pitchTeamHome = document.getElementById('pitch-team-home');
  const pitchTeamAway = document.getElementById('pitch-team-away');
  const pitcherNameInput = document.getElementById('pitcher-name-input');
  const pitcherRosterBtn = document.getElementById('pitcher-roster-btn');
  const pitchSimpleModeView = document.getElementById('pitch-simple-mode-view');
  const pitchAdvModeView = document.getElementById('pitch-adv-mode-view');
  const simplePitchTotalNum = document.getElementById('simple-pitch-total-num');
  const btnSimplePitchAdd = document.getElementById('btn-simple-pitch-add');
  const btnSimplePitchUndo = document.getElementById('btn-simple-pitch-undo');
  const btnSimplePitchReset = document.getElementById('btn-simple-pitch-reset');
  const pitchTotalNum = document.getElementById('pitch-total-num');
  const pitchStrikesNum = document.getElementById('pitch-strikes-num');
  const pitchBallsNum = document.getElementById('pitch-balls-num');
  const pitchPctNum = document.getElementById('pitch-pct-num');
  const btnPitchStrike = document.getElementById('btn-pitch-strike');
  const btnPitchBall = document.getElementById('btn-pitch-ball');
  const btnPitchFoul = document.getElementById('btn-pitch-foul');
  const btnPitchInplay = document.getElementById('btn-pitch-inplay');
  const btnPitchUndo = document.getElementById('btn-pitch-undo');
  const btnPitchReset = document.getElementById('btn-pitch-reset');

  // Enable/Disable Pitch Counter on Main Screen
  function setPitchCounterEnabled(enabled) {
    pitchCounterEnabled = Boolean(enabled);
    try {
      localStorage.setItem('pitch_counter_enabled', String(pitchCounterEnabled));
    } catch (_) {}

    if (togglePitchScoreboard) togglePitchScoreboard.checked = pitchCounterEnabled;
    if (settingsPitchScoreboardToggle) settingsPitchScoreboardToggle.checked = pitchCounterEnabled;

    if (mainPitchWidget) {
      mainPitchWidget.style.display = pitchCounterEnabled ? 'flex' : 'none';
      if (pitchCounterEnabled) {
        triggerPop(mainPitchWidget);
      }
    }
    setTimeout(updateUnderlinePosition, 60);
  }

  if (togglePitchScoreboard) {
    togglePitchScoreboard.addEventListener('change', (e) => {
      setPitchCounterEnabled(e.target.checked);
      showInningToast('PITCH COUNTER', e.target.checked ? 'Enabled on Scoreboard' : 'Hidden from Scoreboard');
    });
  }

  if (settingsPitchScoreboardToggle) {
    settingsPitchScoreboardToggle.addEventListener('change', (e) => {
      setPitchCounterEnabled(e.target.checked);
      showInningToast('PITCH COUNTER', e.target.checked ? 'Enabled on Scoreboard' : 'Hidden from Scoreboard');
    });
  }

  // Pitch Counter Mode (Simple vs Advanced)
  function setPitchCounterMode(mode) {
    pitchCounterMode = mode === 'advanced' ? 'advanced' : 'simple';
    try {
      localStorage.setItem('pitch_counter_mode', pitchCounterMode);
    } catch (_) {}

    // Update panel mode buttons
    if (pitchModeSimpleBtn) pitchModeSimpleBtn.classList.toggle('active', pitchCounterMode === 'simple');
    if (pitchModeAdvBtn) pitchModeAdvBtn.classList.toggle('active', pitchCounterMode === 'advanced');
    if (settingsPitchModeSimple) settingsPitchModeSimple.classList.toggle('active', pitchCounterMode === 'simple');
    if (settingsPitchModeAdv) settingsPitchModeAdv.classList.toggle('active', pitchCounterMode === 'advanced');

    // Update mode badge
    if (mainPitchModePill) mainPitchModePill.textContent = pitchCounterMode.toUpperCase();

    // Toggle views in panel and on main screen
    if (pitchSimpleModeView) pitchSimpleModeView.style.display = pitchCounterMode === 'simple' ? 'block' : 'none';
    if (pitchAdvModeView) pitchAdvModeView.style.display = pitchCounterMode === 'advanced' ? 'block' : 'none';
    if (mainPitchSimpleView) mainPitchSimpleView.style.display = pitchCounterMode === 'simple' ? 'flex' : 'none';
    if (mainPitchAdvView) mainPitchAdvView.style.display = pitchCounterMode === 'advanced' ? 'flex' : 'none';

    updatePitchDisplay();
  }

  if (pitchModeSimpleBtn) pitchModeSimpleBtn.addEventListener('click', () => setPitchCounterMode('simple'));
  if (pitchModeAdvBtn) pitchModeAdvBtn.addEventListener('click', () => setPitchCounterMode('advanced'));
  if (settingsPitchModeSimple) settingsPitchModeSimple.addEventListener('click', () => setPitchCounterMode('simple'));
  if (settingsPitchModeAdv) settingsPitchModeAdv.addEventListener('click', () => setPitchCounterMode('advanced'));

  // Switch Active Pitcher Team (Home vs Away)
  function setActivePitcherTeam(team) {
    activePitcherTeam = team === 'away' ? 'away' : 'home';
    updatePitchDisplay();
  }

  if (pitchTeamHome) pitchTeamHome.addEventListener('click', () => setActivePitcherTeam('home'));
  if (pitchTeamAway) pitchTeamAway.addEventListener('click', () => setActivePitcherTeam('away'));

  // Main screen widget pitcher button switches pitcher
  if (mainPitcherToggleBtn) {
    mainPitcherToggleBtn.addEventListener('click', () => {
      setActivePitcherTeam(activePitcherTeam === 'home' ? 'away' : 'home');
      triggerPop(mainPitcherToggleBtn);
      showInningToast('PITCHER SWAPPED', `Now tracking ${pitcherNames[activePitcherTeam]}`);
    });
  }

  if (mainPitchExpandBtn) {
    mainPitchExpandBtn.addEventListener('click', () => {
      openAdvancedTools('pitches');
    });
  }

  // Pitcher Name Input
  if (pitcherNameInput) {
    pitcherNameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim() || (activePitcherTeam === 'home' ? 'Home Pitcher' : 'Away Pitcher');
      pitcherNames[activePitcherTeam] = val;
      savePitcherNames();
      if (mainPitcherName) mainPitcherName.textContent = val;
    });
  }

  // Quick Pitcher Picker from Roster
  if (pitcherRosterBtn) {
    pitcherRosterBtn.addEventListener('click', () => {
      const teamRoster = rosters[activePitcherTeam] || [];
      const pitchers = teamRoster.filter(p => p.pos === 'P' || p.pos === 'Pitcher');
      const pickList = pitchers.length > 0 ? pitchers : teamRoster;
      if (pickList.length === 0) {
        showInningToast('ROSTER', 'No players on roster yet');
        return;
      }
      const curIndex = pickList.findIndex(p => pitcherNames[activePitcherTeam].includes(p.name));
      const nextIndex = (curIndex + 1) % pickList.length;
      const nextP = pickList[nextIndex];
      const newName = `${nextP.name} #${nextP.num}`;
      pitcherNames[activePitcherTeam] = newName;
      savePitcherNames();
      updatePitchDisplay();
      showInningToast('PITCHER SELECTED', newName);
    });
  }

  // Update All Pitch Display Elements
  function updatePitchDisplay() {
    const cur = pitchData[activePitcherTeam];
    const teamName = activePitcherTeam === 'home' ? homeTeamName : awayTeamName;
    const pitcherName = pitcherNames[activePitcherTeam] || `${teamName} Pitcher`;

    // Simple display numbers
    if (simplePitchTotalNum) simplePitchTotalNum.textContent = cur.total;
    if (mainPitchNumSimple) mainPitchNumSimple.textContent = cur.total;

    // Advanced display numbers
    if (pitchTotalNum) pitchTotalNum.textContent = cur.total;
    if (mainPitchNumAdv) mainPitchNumAdv.textContent = cur.total;
    if (pitchStrikesNum) pitchStrikesNum.textContent = cur.strikes;
    if (pitchBallsNum) pitchBallsNum.textContent = cur.balls;
    const pct = cur.total > 0 ? Math.round((cur.strikes / cur.total) * 100) : 0;
    if (pitchPctNum) pitchPctNum.textContent = `${pct}%`;
    if (mainAdvStrikes) mainAdvStrikes.textContent = cur.strikes;
    if (mainAdvBalls) mainAdvBalls.textContent = cur.balls;
    if (mainAdvPct) mainAdvPct.textContent = `${pct}%`;

    // Team button states
    if (pitchTeamHome) {
      pitchTeamHome.classList.toggle('active', activePitcherTeam === 'home');
      pitchTeamHome.textContent = `${homeTeamName} Pitcher`;
    }
    if (pitchTeamAway) {
      pitchTeamAway.classList.toggle('active', activePitcherTeam === 'away');
      pitchTeamAway.textContent = `${awayTeamName} Pitcher`;
    }

    // Main screen widget badges
    if (mainPitchTeamBadge) {
      mainPitchTeamBadge.textContent = `${activePitcherTeam.toUpperCase()} P`;
    }
    if (mainPitcherName) {
      mainPitcherName.textContent = pitcherName;
    }
    if (pitcherNameInput) {
      pitcherNameInput.value = pitcherName;
    }

    updateRecapCard();
  }

  // Record Pitch Actions
  function recordPitch(type) {
    const cur = pitchData[activePitcherTeam];
    cur.total++;

    if (type === 'strike') {
      cur.strikes++;
      cur.history.push('strike');
    } else if (type === 'ball') {
      cur.balls++;
      cur.history.push('ball');
    } else if (type === 'foul') {
      cur.strikes++;
      cur.fouls++;
      cur.history.push('foul');
    } else if (type === 'inplay') {
      cur.strikes++;
      cur.inplay++;
      cur.history.push('inplay');
    } else {
      // Simple pitch count
      cur.history.push('pitch');
    }

    triggerPop(simplePitchTotalNum);
    triggerPop(pitchTotalNum);
    triggerPop(mainPitchNumSimple);
    triggerPop(mainPitchNumAdv);
    updatePitchDisplay();
  }

  function undoPitch() {
    const cur = pitchData[activePitcherTeam];
    if (cur.history.length === 0 && cur.total === 0) {
      showInningToast('PITCHES', 'No pitches to undo');
      return;
    }

    const lastType = cur.history.pop() || 'pitch';
    cur.total = Math.max(0, cur.total - 1);

    if (lastType === 'strike' || lastType === 'foul' || lastType === 'inplay') {
      cur.strikes = Math.max(0, cur.strikes - 1);
      if (lastType === 'foul') cur.fouls = Math.max(0, cur.fouls - 1);
      if (lastType === 'inplay') cur.inplay = Math.max(0, cur.inplay - 1);
    } else if (lastType === 'ball') {
      cur.balls = Math.max(0, cur.balls - 1);
    }

    triggerPop(simplePitchTotalNum);
    triggerPop(pitchTotalNum);
    triggerPop(mainPitchNumSimple);
    triggerPop(mainPitchNumAdv);
    updatePitchDisplay();
    showInningToast('UNDO', `Reverted last ${lastType}`);
  }

  function resetPitchCounter() {
    const cur = pitchData[activePitcherTeam];
    cur.total = 0;
    cur.strikes = 0;
    cur.balls = 0;
    cur.fouls = 0;
    cur.inplay = 0;
    cur.history = [];

    triggerPop(simplePitchTotalNum);
    triggerPop(pitchTotalNum);
    triggerPop(mainPitchNumSimple);
    triggerPop(mainPitchNumAdv);
    updatePitchDisplay();
    showInningToast('RESET', `${pitcherNames[activePitcherTeam]} count cleared`);
  }

  // Pitch Action Event Listeners
  if (btnSimplePitchAdd) btnSimplePitchAdd.addEventListener('click', () => recordPitch('pitch'));
  if (btnSimplePitchUndo) btnSimplePitchUndo.addEventListener('click', undoPitch);
  if (btnSimplePitchReset) btnSimplePitchReset.addEventListener('click', resetPitchCounter);
  if (mainSimpleAddBtn) mainSimpleAddBtn.addEventListener('click', () => recordPitch('pitch'));
  if (mainSimpleUndoBtn) mainSimpleUndoBtn.addEventListener('click', undoPitch);

  if (btnPitchStrike) btnPitchStrike.addEventListener('click', () => recordPitch('strike'));
  if (btnPitchBall) btnPitchBall.addEventListener('click', () => recordPitch('ball'));
  if (btnPitchFoul) btnPitchFoul.addEventListener('click', () => recordPitch('foul'));
  if (btnPitchInplay) btnPitchInplay.addEventListener('click', () => recordPitch('inplay'));
  if (btnPitchUndo) btnPitchUndo.addEventListener('click', undoPitch);
  if (btnPitchReset) btnPitchReset.addEventListener('click', resetPitchCounter);

  if (mainAdvBtnStrike) mainAdvBtnStrike.addEventListener('click', () => recordPitch('strike'));
  if (mainAdvBtnBall) mainAdvBtnBall.addEventListener('click', () => recordPitch('ball'));
  if (mainAdvBtnFoul) mainAdvBtnFoul.addEventListener('click', () => recordPitch('foul'));
  if (mainAdvBtnInplay) mainAdvBtnInplay.addEventListener('click', () => recordPitch('inplay'));
  if (mainAdvBtnUndo) mainAdvBtnUndo.addEventListener('click', undoPitch);

  // Initialize pitch counter settings & display
  setPitchCounterEnabled(pitchCounterEnabled);
  setPitchCounterMode(pitchCounterMode);

  // --- 3. Hit Log Logic (Configurable Roster, Authentic Spray Chart & Searchable Outcomes) ---
  let hitTeam = 'away';
  let selectedPlayerName = 'Mookie Betts #50';
  let selectedZone = 'Center Field (CF)';
  let selectedDistance = 385;
  let currentSprayCoords = { x: 170, y: 115 };
  let hitLogEntries = [];

  // Team Rosters (Configurable & Saved to localStorage)
  const defaultRosters = {
    home: [
      { id: 1, name: 'Marcus Semien', num: '2', pos: '2B' },
      { id: 2, name: 'Corey Seager', num: '5', pos: 'SS' },
      { id: 3, name: 'Evan Carter', num: '32', pos: 'LF' },
      { id: 4, name: 'Adolis Garcia', num: '53', pos: 'RF' },
      { id: 5, name: 'Nathaniel Lowe', num: '30', pos: '1B' },
      { id: 6, name: 'Josh Jung', num: '6', pos: '3B' },
      { id: 7, name: 'Jonah Heim', num: '28', pos: 'C' },
      { id: 8, name: 'Leody Taveras', num: '3', pos: 'CF' },
      { id: 9, name: 'Nathan Eovaldi', num: '17', pos: 'P' }
    ],
    away: [
      { id: 101, name: 'Mookie Betts', num: '50', pos: 'SS' },
      { id: 102, name: 'Shohei Ohtani', num: '17', pos: 'DH' },
      { id: 103, name: 'Freddie Freeman', num: '5', pos: '1B' },
      { id: 104, name: 'Will Smith', num: '16', pos: 'C' },
      { id: 105, name: 'Max Muncy', num: '13', pos: '3B' },
      { id: 106, name: 'Teoscar Hernandez', num: '37', pos: 'LF' },
      { id: 107, name: 'James Outman', num: '33', pos: 'CF' },
      { id: 108, name: 'Jason Heyward', num: '23', pos: 'RF' },
      { id: 109, name: 'Yoshinobu Yamamoto', num: '18', pos: 'P' }
    ]
  };

  let rosters = defaultRosters;
  try {
    const savedRosters = JSON.parse(localStorage.getItem('baseball_rosters_v2'));
    if (savedRosters && savedRosters.home && savedRosters.away) {
      rosters = savedRosters;
    }
  } catch (_) {}

  function saveRosters() {
    try {
      localStorage.setItem('baseball_rosters_v2', JSON.stringify(rosters));
    } catch (_) {}
  }

  // Hit Log DOM Elements
  const hitTeamAway = document.getElementById('hit-team-away');
  const hitTeamHome = document.getElementById('hit-team-home');
  const hitPlayerDropdown = document.getElementById('hit-player-dropdown');
  const btnToggleAddPlayer = document.getElementById('btn-toggle-add-player');
  const addPlayerBox = document.getElementById('add-player-box');
  const newPlayerNameInput = document.getElementById('new-player-name');
  const newPlayerNumInput = document.getElementById('new-player-num');
  const newPlayerPosSelect = document.getElementById('new-player-pos');
  const btnSavePlayer = document.getElementById('btn-save-player');
  const btnCancelAddPlayer = document.getElementById('btn-cancel-add-player');
  const btnRemovePlayer = document.getElementById('btn-remove-player');
  const quickPlayerChips = document.getElementById('quick-player-chips');

  // Authentic Spray Chart Elements
  const baseballFieldSvg = document.getElementById('baseball-field-svg');
  const selectedZoneTag = document.getElementById('selected-zone-tag');
  const activeSprayMarkerGroup = document.getElementById('active-spray-marker-group');
  const sprayTrajectory = document.getElementById('spray-trajectory');
  const historicSprayDots = document.getElementById('historic-spray-dots');

  // Searchable Outcome Elements
  const selectedOutcomeDisplay = document.getElementById('selected-outcome-display');
  const currentOutcomePill = document.getElementById('current-outcome-pill');
  const currentOutcomeDesc = document.getElementById('current-outcome-desc');
  const btnToggleOutcomeDropdown = document.getElementById('btn-toggle-outcome-dropdown');
  const searchableOutcomeBox = document.getElementById('searchable-outcome-box');
  const outcomeSearchInput = document.getElementById('outcome-search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const outcomeDropdownList = document.getElementById('outcome-dropdown-list');
  const quickOutcomeChips = document.querySelectorAll('#quick-outcome-chips .quick-chip');
  const btnLogHitCommit = document.getElementById('btn-log-hit-commit');
  const hitLogList = document.getElementById('hit-log-list');
  const hitLogCount = document.getElementById('hit-log-count');
  const clearLogBtn = document.getElementById('clear-log-btn');

  // Comprehensive Baseball Play Outcomes List (35+ Plays)
  const baseballOutcomes = [
    // HITS
    { name: '1B Single', type: 'hit', isHit: true, desc: 'Clean base hit into outfield or through infield' },
    { name: '2B Double', type: 'hit', isHit: true, desc: 'Extra-base hit into gap or down the line' },
    { name: '3B Triple', type: 'hit', isHit: true, desc: 'Extra-base hit to deep warning track or wall' },
    { name: 'Home Run (HR)', type: 'hit', isHit: true, desc: 'Over-the-fence four-base home run' },
    { name: 'Inside-the-Park HR', type: 'hit', isHit: true, desc: 'Hit stays in play, batter circles bases and scores' },
    { name: 'Ground-Rule Double', type: 'hit', isHit: true, desc: 'Bounces over outfield wall for automatic 2B' },
    { name: 'Infield Single', type: 'hit', isHit: true, desc: 'Batter beats out throw to first base on infield hit' },
    { name: 'Bunt Single', type: 'hit', isHit: true, desc: 'Deliberate bunt executed for base hit' },

    // OUTS
    { name: 'Flyout', type: 'out', isHit: false, desc: 'Fly ball caught in the air by outfielder' },
    { name: 'Groundout', type: 'out', isHit: false, desc: 'Ground ball fielded and thrown to 1B for out' },
    { name: 'Lineout', type: 'out', isHit: false, desc: 'Sharp line drive caught in air by fielder' },
    { name: 'Pop Out', type: 'out', isHit: false, desc: 'High pop fly caught by infielder' },
    { name: 'Strikeout (K)', type: 'out', isHit: false, desc: 'Batter strikes out swinging on strike 3' },
    { name: 'Strikeout Looking (ꓘ)', type: 'out', isHit: false, desc: 'Called third strike caught in strike zone' },
    { name: 'Foul Tip Strikeout', type: 'out', isHit: false, desc: 'Foul tip caught directly by catcher with 2 strikes' },
    { name: '6-4-3 Double Play', type: 'out', isHit: false, desc: 'Grounder to SS, flipped to 2B, on to 1B' },
    { name: '4-6-3 Double Play', type: 'out', isHit: false, desc: 'Grounder to 2B, flipped to SS, on to 1B' },
    { name: 'Double Play (Other)', type: 'out', isHit: false, desc: 'Two outs recorded on continuous batted play' },
    { name: 'Triple Play', type: 'out', isHit: false, desc: 'Three outs executed on continuous batted play' },
    { name: 'Sacrifice Fly (SF)', type: 'out', isHit: false, desc: 'Deep fly out allowing baserunner to tag and score' },
    { name: 'Sacrifice Bunt (SAC)', type: 'out', isHit: false, desc: 'Bunt executed to advance baserunners' },
    { name: 'Fielder\'s Choice Out', type: 'out', isHit: false, desc: 'Defense throws out lead runner on basepaths' },
    { name: 'Caught Stealing (CS)', type: 'out', isHit: false, desc: 'Runner tagged out attempting to advance/steal' },
    { name: 'Pickoff Out (PO)', type: 'out', isHit: false, desc: 'Runner tagged out off base on pitcher pickoff' },
    { name: 'Batter Interference', type: 'out', isHit: false, desc: 'Batter impedes catcher throwing or fielding' },

    // REACHED BASE / MISC
    { name: 'Walk (BB)', type: 'misc', isHit: false, desc: 'Awarded 1B after 4 pitches outside strike zone' },
    { name: 'Intentional Walk (IBB)', type: 'misc', isHit: false, desc: 'Pitcher intentionally awards batter 1B' },
    { name: 'Hit By Pitch (HBP)', type: 'misc', isHit: false, desc: 'Pitched ball strikes batter in batter box' },
    { name: 'Error (E)', type: 'misc', isHit: false, desc: 'Fielder misplays or overthrows batted ball' },
    { name: 'Error - Throwing', type: 'misc', isHit: false, desc: 'Fielder wild throw allows batter to reach base' },
    { name: 'Fielder\'s Choice (FC)', type: 'misc', isHit: false, desc: 'Batter reaches base safely as defense plays runner' },
    { name: 'Dropped 3rd Strike', type: 'misc', isHit: false, desc: 'Uncaught strike 3, batter beats throw to 1B' },
    { name: 'Catcher Interference (CI)', type: 'misc', isHit: false, desc: 'Catcher mitt touches bat during swing' },
    { name: 'Balk (BK)', type: 'misc', isHit: false, desc: 'Illegal pitcher motion advances base runners' },
    { name: 'Wild Pitch / Passed Ball', type: 'misc', isHit: false, desc: 'Pitch gets away from catcher allowing advance' }
  ];

  let selectedOutcome = baseballOutcomes[0].name;
  let selectedIsHit = baseballOutcomes[0].isHit;
  let selectedOutcomeType = baseballOutcomes[0].type;
  let selectedOutcomeDesc = baseballOutcomes[0].desc;

  // Render Roster Dropdown & Dynamic Quick Chips
  function renderRosterUI() {
    const currentRoster = rosters[hitTeam] || [];

    // Populate dropdown
    if (hitPlayerDropdown) {
      hitPlayerDropdown.innerHTML = currentRoster.map((player) => {
        const label = `${player.name} #${player.num} (${player.pos})`;
        const selected = label === selectedPlayerName ? 'selected' : '';
        return `<option value="${label}" ${selected}>${label}</option>`;
      }).join('');

      if (!currentRoster.some(p => `${p.name} #${p.num} (${p.pos})` === selectedPlayerName) && currentRoster.length > 0) {
        const first = currentRoster[0];
        selectedPlayerName = `${first.name} #${first.num} (${first.pos})`;
        hitPlayerDropdown.value = selectedPlayerName;
      }
    }

    // Populate quick chips
    if (quickPlayerChips) {
      quickPlayerChips.innerHTML = currentRoster.map((player) => {
        const label = `${player.name} #${player.num} (${player.pos})`;
        const isActive = label === selectedPlayerName;
        return `
          <button type="button" class="chip-btn ${isActive ? 'active' : ''}" data-player="${label}">
            #${player.num} ${player.name.split(' ')[1] || player.name}
          </button>
        `;
      }).join('');

      quickPlayerChips.querySelectorAll('.chip-btn').forEach((chip) => {
        chip.addEventListener('click', () => {
          quickPlayerChips.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          selectedPlayerName = chip.getAttribute('data-player');
          if (hitPlayerDropdown) hitPlayerDropdown.value = selectedPlayerName;
        });
      });
    }
  }

  // Dropdown selection change
  if (hitPlayerDropdown) {
    hitPlayerDropdown.addEventListener('change', (e) => {
      selectedPlayerName = e.target.value;
      if (quickPlayerChips) {
        quickPlayerChips.querySelectorAll('.chip-btn').forEach(c => {
          c.classList.toggle('active', c.getAttribute('data-player') === selectedPlayerName);
        });
      }
    });
  }

  // Add Player Toggle & Save
  if (btnToggleAddPlayer) {
    btnToggleAddPlayer.addEventListener('click', () => {
      if (!addPlayerBox) return;
      const isOpen = addPlayerBox.style.display !== 'none';
      addPlayerBox.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen && newPlayerNameInput) newPlayerNameInput.focus();
    });
  }

  if (btnCancelAddPlayer) {
    btnCancelAddPlayer.addEventListener('click', () => {
      if (addPlayerBox) addPlayerBox.style.display = 'none';
    });
  }

  if (btnSavePlayer) {
    btnSavePlayer.addEventListener('click', () => {
      const name = (newPlayerNameInput && newPlayerNameInput.value.trim());
      if (!name) {
        showInningToast('ROSTER', 'Please enter a player name');
        return;
      }
      const rawNum = (newPlayerNumInput && newPlayerNumInput.value.replace(/[^0-9]/g, '')) || '00';
      const pos = (newPlayerPosSelect && newPlayerPosSelect.value) || 'OF';

      const newPlayer = {
        id: Date.now(),
        name: name,
        num: rawNum,
        pos: pos
      };

      rosters[hitTeam].push(newPlayer);
      saveRosters();

      selectedPlayerName = `${name} #${rawNum} (${pos})`;
      renderRosterUI();

      if (newPlayerNameInput) newPlayerNameInput.value = '';
      if (newPlayerNumInput) newPlayerNumInput.value = '';
      if (addPlayerBox) addPlayerBox.style.display = 'none';

      showInningToast('PLAYER SAVED', `${name} added to ${hitTeam === 'home' ? homeTeamName : awayTeamName} roster`);
    });
  }

  // Remove Player
  if (btnRemovePlayer) {
    btnRemovePlayer.addEventListener('click', () => {
      const currentRoster = rosters[hitTeam];
      if (currentRoster.length <= 1) {
        showInningToast('ROSTER', 'Roster must have at least one player');
        return;
      }
      const idx = currentRoster.findIndex(p => `${p.name} #${p.num} (${p.pos})` === selectedPlayerName);
      if (idx !== -1) {
        const removed = currentRoster.splice(idx, 1)[0];
        saveRosters();
        selectedPlayerName = `${currentRoster[0].name} #${currentRoster[0].num} (${currentRoster[0].pos})`;
        renderRosterUI();
        showInningToast('REMOVED', `${removed.name} removed from roster`);
      }
    });
  }

  // Hit Team Toggles
  function updateHitTeamUI() {
    if (hitTeamAway) {
      hitTeamAway.classList.toggle('active', hitTeam === 'away');
      hitTeamAway.textContent = `${awayTeamName} (Batting)`;
    }
    if (hitTeamHome) {
      hitTeamHome.classList.toggle('active', hitTeam === 'home');
      hitTeamHome.textContent = homeTeamName;
    }
    renderRosterUI();
  }

  if (hitTeamAway) {
    hitTeamAway.addEventListener('click', () => {
      hitTeam = 'away';
      updateHitTeamUI();
    });
  }
  if (hitTeamHome) {
    hitTeamHome.addEventListener('click', () => {
      hitTeam = 'home';
      updateHitTeamUI();
    });
  }

  // Authentic Baseball Field Spray Chart Click & Zone Detector
  function selectFieldSprayPoint(svgX, svgY, manualZone = null) {
    currentSprayCoords = { x: svgX, y: svgY };

    // Distance calculation from home plate (170, 285) in authentic ballpark feet
    const dx = svgX - 170;
    const dy = svgY - 285;
    const pixelDist = Math.hypot(dx, dy);
    // 0 distance at home is ~60 ft, fence is ~400 ft
    selectedDistance = Math.max(60, Math.min(440, Math.round(pixelDist * 1.7 + 60)));

    let detected = manualZone;
    if (!detected) {
      if (svgY > 260) {
        detected = 'Catcher / Infield';
      } else if (svgY > 215) {
        if (svgX < 135) detected = '3rd Base (3B)';
        else if (svgX > 205) detected = '1st Base (1B)';
        else if (Math.abs(svgX - 170) < 22) detected = 'Pitcher (P)';
        else detected = 'Infield Dirt';
      } else if (svgY > 175) {
        if (svgX < 145) detected = 'Shortstop (SS)';
        else if (svgX > 195) detected = '2nd Base (2B)';
        else detected = 'Behind 2B';
      } else if (svgY > 130) {
        if (svgX < 110) detected = 'Left Field (LF)';
        else if (svgX > 230) detected = 'Right Field (RF)';
        else detected = 'Center Field (CF)';
      } else {
        // Deep Outfield
        if (svgX < 115) detected = 'Deep Left (LF)';
        else if (svgX > 225) detected = 'Deep Right (RF)';
        else if (svgX < 155) detected = 'Left-Center (LCF)';
        else if (svgX > 185) detected = 'Right-Center (RCF)';
        else detected = 'Center Field (CF)';
      }
    }

    selectedZone = detected;
    if (selectedZoneTag) {
      selectedZoneTag.textContent = `${detected} • ${selectedDistance} ft`;
    }

    // Move marker & trajectory
    if (activeSprayMarkerGroup) {
      activeSprayMarkerGroup.setAttribute('transform', `translate(${svgX}, ${svgY})`);
    }
    if (sprayTrajectory) {
      sprayTrajectory.setAttribute('x1', '170');
      sprayTrajectory.setAttribute('y1', '285');
      sprayTrajectory.setAttribute('x2', String(svgX));
      sprayTrajectory.setAttribute('y2', String(svgY));
    }

    // Highlight zone poly
    const allZones = document.querySelectorAll('.zone-poly, .zone-circle');
    allZones.forEach((z) => {
      const zName = z.getAttribute('data-zone') || '';
      z.classList.toggle('active', zName.includes(detected) || detected.includes(zName));
    });
  }

  if (baseballFieldSvg) {
    baseballFieldSvg.addEventListener('click', (e) => {
      const rect = baseballFieldSvg.getBoundingClientRect();
      const scaleX = 340 / rect.width;
      const scaleY = 320 / rect.height;
      const svgX = Math.round(Math.max(15, Math.min(325, (e.clientX - rect.left) * scaleX)));
      const svgY = Math.round(Math.max(30, Math.min(300, (e.clientY - rect.top) * scaleY)));

      const targetZone = e.target.closest('[data-zone]');
      const zoneName = targetZone ? targetZone.getAttribute('data-zone') : null;
      selectFieldSprayPoint(svgX, svgY, zoneName);
    });
  }

  // Historic Spray Chart Dots Renderer
  function renderHistoricSprayDots() {
    if (!historicSprayDots) return;
    if (hitLogEntries.length === 0) {
      historicSprayDots.innerHTML = '';
      return;
    }

    historicSprayDots.innerHTML = hitLogEntries.map((entry) => {
      let fillColor = '#ef4444';
      if (entry.outcome.includes('Home Run')) fillColor = '#eab308';
      else if (entry.outcome.includes('Triple')) fillColor = '#f97316';
      else if (entry.outcome.includes('Double')) fillColor = '#3b82f6';
      else if (entry.isHit) fillColor = '#22c55e';
      else if (entry.outcome.includes('Walk') || entry.outcome.includes('Error')) fillColor = '#a855f7';

      return `
        <circle cx="${entry.x || 170}" cy="${entry.y || 115}" r="5"
          fill="${fillColor}" class="historic-dot"
          data-id="${entry.id}">
          <title>${entry.outcome} by ${entry.player} (${entry.zone} • ${entry.distance || 0} ft)</title>
        </circle>
      `;
    }).join('');

    historicSprayDots.querySelectorAll('.historic-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(dot.getAttribute('data-id'));
        const entry = hitLogEntries.find(i => i.id === id);
        if (entry) {
          showInningToast(entry.outcome.split(' ')[0], `${entry.player} • ${entry.zone}`);
        }
      });
    });
  }

  // Searchable Outcome Dropdown Implementation
  function setPlayOutcome(outcomeObj) {
    selectedOutcome = outcomeObj.name;
    selectedIsHit = outcomeObj.isHit;
    selectedOutcomeType = outcomeObj.type;
    selectedOutcomeDesc = outcomeObj.desc;

    if (currentOutcomePill) {
      currentOutcomePill.textContent = selectedOutcome;
      currentOutcomePill.className = `outcome-badge-pill ${selectedOutcomeType}`;
    }
    if (currentOutcomeDesc) {
      currentOutcomeDesc.textContent = selectedOutcomeDesc;
    }

    // Sync quick chips
    quickOutcomeChips.forEach((chip) => {
      const chipOutcome = chip.getAttribute('data-outcome');
      chip.classList.toggle('active', chipOutcome === selectedOutcome);
    });

    if (searchableOutcomeBox) searchableOutcomeBox.classList.remove('open');
  }

  function renderOutcomeList(query = '') {
    if (!outcomeDropdownList) return;
    const lowerQuery = query.toLowerCase().trim();

    const filtered = lowerQuery === ''
      ? baseballOutcomes
      : baseballOutcomes.filter(o => o.name.toLowerCase().includes(lowerQuery) || o.desc.toLowerCase().includes(lowerQuery));

    if (filtered.length === 0) {
      outcomeDropdownList.innerHTML = `<div style="padding: 12px; font-size: 11px; color: var(--text-secondary); text-align: center;">No matching outcomes found for "${query}"</div>`;
      return;
    }

    const groups = {
      'HITS': filtered.filter(o => o.type === 'hit'),
      'OUTS': filtered.filter(o => o.type === 'out'),
      'REACHED BASE / MISC': filtered.filter(o => o.type === 'misc')
    };

    let html = '';
    for (const [groupName, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      html += `<div class="outcome-group-header">${groupName}</div>`;
      items.forEach((item) => {
        const isSelected = item.name === selectedOutcome;
        html += `
          <div class="outcome-dropdown-item ${isSelected ? 'selected' : ''}" data-name="${item.name}">
            <div class="outcome-item-left">
              <span class="outcome-type-tag ${item.type}">${item.type}</span>
              <span class="outcome-item-name">${item.name}</span>
            </div>
            <span class="outcome-item-desc">${item.desc}</span>
          </div>
        `;
      });
    }

    outcomeDropdownList.innerHTML = html;

    outcomeDropdownList.querySelectorAll('.outcome-dropdown-item').forEach((itemEl) => {
      itemEl.addEventListener('click', () => {
        const name = itemEl.getAttribute('data-name');
        const match = baseballOutcomes.find(o => o.name === name);
        if (match) setPlayOutcome(match);
      });
    });
  }

  if (btnToggleOutcomeDropdown) {
    btnToggleOutcomeDropdown.addEventListener('click', () => {
      if (!searchableOutcomeBox) return;
      const isOpen = searchableOutcomeBox.classList.contains('open');
      if (isOpen) {
        searchableOutcomeBox.classList.remove('open');
      } else {
        searchableOutcomeBox.classList.add('open');
        renderOutcomeList(outcomeSearchInput ? outcomeSearchInput.value : '');
        if (outcomeSearchInput) outcomeSearchInput.focus();
      }
    });
  }

  if (outcomeSearchInput) {
    outcomeSearchInput.addEventListener('input', (e) => {
      renderOutcomeList(e.target.value);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (outcomeSearchInput) {
        outcomeSearchInput.value = '';
        renderOutcomeList('');
        outcomeSearchInput.focus();
      }
    });
  }

  // Quick Outcome Shortcut Chips (Single, Double, Triple, HR, Flyout, Groundout, Strikeout, Walk, Error)
  quickOutcomeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const outcomeName = chip.getAttribute('data-outcome');
      const match = baseballOutcomes.find(o => o.name === outcomeName);
      if (match) setPlayOutcome(match);
    });
  });

  // Render Hit Log List
  function renderHitLogList() {
    if (!hitLogList) return;
    if (hitLogCount) hitLogCount.textContent = hitLogEntries.length;

    if (hitLogEntries.length === 0) {
      hitLogList.innerHTML = `<div class="empty-log-notice">No hits or plays recorded yet. Tap above to log plays!</div>`;
      renderHistoricSprayDots();
      return;
    }

    hitLogList.innerHTML = hitLogEntries.map((entry) => {
      let badgeClass = 'misc';
      if (entry.outcome.includes('Home Run')) badgeClass = 'hr';
      else if (entry.isHit) badgeClass = 'hit';
      else if (entry.outcome.includes('out') || entry.outcome.includes('Strikeout')) badgeClass = 'out';

      return `
        <div class="hit-log-item" data-id="${entry.id}">
          <div class="item-left">
            <span class="item-badge ${badgeClass}">${entry.outcome.split(' ')[0]}</span>
            <span class="item-player">${entry.player} (${entry.teamName})</span>
            <span class="item-zone">→ ${entry.zone.split(' ')[0]} • ${entry.distance || 0}ft</span>
          </div>
          <button type="button" class="delete-hit-btn" data-delete-id="${entry.id}" title="Remove play">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    renderHistoricSprayDots();

    hitLogList.querySelectorAll('.delete-hit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute('data-delete-id'));
        const idx = hitLogEntries.findIndex((item) => item.id === id);
        if (idx !== -1) {
          const removed = hitLogEntries[idx];
          if (removed.isHit && teamHits[removed.team] > 0) {
            teamHits[removed.team]--;
          }
          hitLogEntries.splice(idx, 1);
          renderHitLogList();
          updateBoxScoreTable();
          showInningToast('DELETED', 'Play removed from log');
        }
      });
    });
  }

  // Record Play to Hit Log Commit Button
  if (btnLogHitCommit) {
    btnLogHitCommit.addEventListener('click', () => {
      const playerName = selectedPlayerName || 'Lead-off Batter';
      const team = hitTeam;
      const teamName = team === 'home' ? homeTeamName : awayTeamName;

      const entry = {
        id: Date.now(),
        player: playerName,
        team: team,
        teamName: teamName,
        zone: selectedZone,
        distance: selectedDistance,
        x: currentSprayCoords.x,
        y: currentSprayCoords.y,
        outcome: selectedOutcome,
        isHit: selectedIsHit,
        inning: `${isTopInning ? 'Top' : 'Bottom'} ${currentInning}`,
        timestamp: formatTime(secondsElapsed)
      };

      hitLogEntries.unshift(entry);

      if (entry.isHit) {
        teamHits[team]++;
        showInningToast('HIT RECORDED!', `${entry.outcome} by ${playerName.split(' ')[0]}`);
      } else if (entry.outcome.includes('Error')) {
        const fieldingTeam = team === 'home' ? 'away' : 'home';
        teamErrors[fieldingTeam]++;
        showInningToast('ERROR', `Charged to ${fieldingTeam === 'home' ? homeTeamName : awayTeamName}`);
      } else {
        showInningToast('PLAY RECORDED', `${entry.outcome} by ${playerName.split(' ')[0]}`);
      }

      renderHitLogList();
      updateBoxScoreTable();
      triggerPop(btnLogHitCommit);
    });
  }

  if (clearLogBtn) {
    clearLogBtn.addEventListener('click', () => {
      if (hitLogEntries.length === 0) return;
      hitLogEntries = [];
      teamHits.home = 0;
      teamHits.away = 0;
      renderHitLogList();
      updateBoxScoreTable();
      showInningToast('LOG CLEARED', 'All plays reset');
    });
  }

  // Initialize Roster UI & Field Point
  renderRosterUI();
  selectFieldSprayPoint(170, 115, 'Center Field (CF)');
  renderOutcomeList('');


  // --- 4. Finish Game & Pictureized Summary ---
  const pictureSummaryCard = document.getElementById('picture-summary-card');
  const cardStatusTag = document.getElementById('card-status-tag');
  const cardHomeName = document.getElementById('card-home-name');
  const cardHomeScore = document.getElementById('card-home-score');
  const cardAwayName = document.getElementById('card-away-name');
  const cardAwayScore = document.getElementById('card-away-score');
  const cardLineHome = document.getElementById('card-line-home');
  const cardLineHomeR = document.getElementById('card-line-home-r');
  const cardLineHomeH = document.getElementById('card-line-home-h');
  const cardLineHomeE = document.getElementById('card-line-home-e');
  const cardLineAway = document.getElementById('card-line-away');
  const cardLineAwayR = document.getElementById('card-line-away-r');
  const cardLineAwayH = document.getElementById('card-line-away-h');
  const cardLineAwayE = document.getElementById('card-line-away-e');
  const cardDuration = document.getElementById('card-duration');
  const cardInningFinal = document.getElementById('card-inning-final');
  const cardTotalPitches = document.getElementById('card-total-pitches');
  const cardDateStamp = document.getElementById('card-date-stamp');
  const btnDownloadImage = document.getElementById('btn-download-image');
  const btnCopyCardSummary = document.getElementById('btn-copy-card-summary');
  const btnFinishGameToggle = document.getElementById('btn-finish-game-toggle');
  const finishGameBtnText = document.getElementById('finish-game-btn-text');

  function updateRecapCard() {
    if (cardHomeName) cardHomeName.textContent = homeTeamName;
    if (cardAwayName) cardAwayName.textContent = awayTeamName;
    if (cardHomeScore) cardHomeScore.textContent = homeScoreVal;
    if (cardAwayScore) cardAwayScore.textContent = awayScoreVal;

    if (cardLineHome) cardLineHome.textContent = homeTeamName;
    if (cardLineHomeR) cardLineHomeR.textContent = homeScoreVal;
    if (cardLineHomeH) cardLineHomeH.textContent = teamHits.home;
    if (cardLineHomeE) cardLineHomeE.textContent = teamErrors.home;

    if (cardLineAway) cardLineAway.textContent = awayTeamName;
    if (cardLineAwayR) cardLineAwayR.textContent = awayScoreVal;
    if (cardLineAwayH) cardLineAwayH.textContent = teamHits.away;
    if (cardLineAwayE) cardLineAwayE.textContent = teamErrors.away;

    if (cardDuration) cardDuration.textContent = formatTime(secondsElapsed);
    if (cardInningFinal) {
      cardInningFinal.textContent = isGameFinal
        ? `Final / ${currentInning} Inn`
        : `${isTopInning ? 'Top' : 'Bot'} ${currentInning}`;
    }

    const totalPitches = pitchData.home.total + pitchData.away.total;
    if (cardTotalPitches) cardTotalPitches.textContent = `${totalPitches} Pitches`;

    if (cardDateStamp) {
      const now = new Date();
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      cardDateStamp.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    }

    if (cardStatusTag) {
      cardStatusTag.textContent = isGameFinal ? 'FINAL' : 'LIVE';
      cardStatusTag.style.backgroundColor = isGameFinal ? '#ef4444' : '#10b981';
    }

    if (finishGameBtnText && btnFinishGameToggle) {
      finishGameBtnText.textContent = isGameFinal ? 'Resume Active Game' : 'Finish & Finalize Game';
      btnFinishGameToggle.classList.toggle('finalized', isGameFinal);
    }
  }

  if (btnFinishGameToggle) {
    btnFinishGameToggle.addEventListener('click', () => {
      isGameFinal = !isGameFinal;
      if (isGameFinal) {
        if (isTimerRunning) toggleTimer();
        showInningToast('GAME OVER', 'Official match finalized!');
      } else {
        showInningToast('RESUMED', 'Game set back to live');
      }
      triggerPop(btnFinishGameToggle);
      updateRecapCard();
    });
  }

  // --- Picture Card Canvas PNG Export ---
  function exportRecapCardImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Card background
    const bgGrad = ctx.createLinearGradient(0, 0, 900, 620);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, 900, 620, 32);
    ctx.fill();

    // Outer border
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('⚾ OFFICIAL GAME RECAP', 44, 52);

    // Final badge
    ctx.fillStyle = isGameFinal ? '#ef4444' : '#10b981';
    ctx.beginPath();
    ctx.roundRect(750, 30, 105, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isGameFinal ? 'FINAL' : 'LIVE', 802, 53);

    // Scoreboard Matchup Banner Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(44, 85, 812, 170, 24);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Home Team Side
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(homeTeamName.toUpperCase(), 240, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText(String(homeScoreVal), 240, 220);

    // Divider
    ctx.fillStyle = '#64748b';
    ctx.font = '900 54px system-ui, sans-serif';
    ctx.fillText('-', 450, 180);

    // Away Team Side
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(awayTeamName.toUpperCase(), 660, 130);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px system-ui, sans-serif';
    ctx.fillText(String(awayScoreVal), 660, 220);

    // Line score Table Box
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(44, 280, 812, 185, 20);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Line score Table Header
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('TEAM', 70, 314);
    for (let i = 1; i <= 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillText(String(i), 190 + (i - 1) * 44, 314);
    }
    ctx.fillText('R', 650, 314);
    ctx.fillText('H', 720, 314);
    ctx.fillText('E', 790, 314);

    // Separator line
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(60, 328);
    ctx.lineTo(840, 328);
    ctx.stroke();

    // Away Row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(awayTeamName, 70, 365);
    for (let i = 0; i < 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(String(inningRuns.away[i] || 0), 190 + i * 44, 365);
    }
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(String(awayScoreVal), 650, 365);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(String(teamHits.away), 720, 365);
    ctx.fillText(String(teamErrors.away), 790, 365);

    // Home Row
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(homeTeamName, 70, 420);
    for (let i = 0; i < 9; i++) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(String(inningRuns.home[i] || 0), 190 + i * 44, 420);
    }
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 20px system-ui, sans-serif';
    ctx.fillText(String(homeScoreVal), 650, 420);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(String(teamHits.home), 720, 420);
    ctx.fillText(String(teamErrors.home), 790, 420);

    // Stats bar Pills
    const statsPills = [
      `⏱ ${formatTime(secondsElapsed)}`,
      `⚾ ${isGameFinal ? `Final / ${currentInning} Inn` : `Inning ${currentInning}`}`,
      `🎯 ${pitchData.home.total + pitchData.away.total} Pitches`
    ];

    statsPills.forEach((stat, idx) => {
      const px = 44 + idx * 280;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(px, 490, 252, 44, 14);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat, px + 126, 518);
    });

    // Footer Watermark & Date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(dateStr, 48, 582);
    ctx.textAlign = 'right';
    ctx.fillText('BASEBALL SCOREKEEPER APP', 856, 582);

    // Download PNG
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `baseball-game-recap-${Date.now()}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showInningToast('SAVED IMAGE', 'Game recap graphic downloaded!');
    } catch (_) {
      showInningToast('EXPORT', 'Could not save image');
    }
  }

  if (btnDownloadImage) {
    btnDownloadImage.addEventListener('click', exportRecapCardImage);
  }

  if (btnCopyCardSummary) {
    btnCopyCardSummary.addEventListener('click', () => {
      const totalPitches = pitchData.home.total + pitchData.away.total;
      const summaryText = [
        `⚾ OFFICIAL BASEBALL RECAP [${isGameFinal ? 'FINAL' : 'LIVE'}]`,
        `=================================`,
        `${homeTeamName}: ${homeScoreVal} runs, ${teamHits.home} hits, ${teamErrors.home} errors`,
        `${awayTeamName}: ${awayScoreVal} runs, ${teamHits.away} hits, ${teamErrors.away} errors`,
        `---------------------------------`,
        `Inning:     ${isGameFinal ? 'Final' : (isTopInning ? 'Top' : 'Bottom')} ${currentInning}`,
        `Duration:   ${formatTime(secondsElapsed)}`,
        `Pitches:    ${totalPitches} (${pitchData.home.total} Home / ${pitchData.away.total} Away)`,
        `Date:       ${new Date().toLocaleDateString('en-US')}`,
        `=================================`
      ].join('\n');
      copyTextToClipboard(summaryText, btnCopyCardSummary);
    });
  }

  // --- 5. Advanced Tools Drawer Opening & Switching ---
  const advancedToolsTabBtn = document.getElementById('advanced-tools-tab-btn');
  const advancedBackdrop = document.getElementById('advanced-backdrop');
  const closeAdvancedBtn = document.getElementById('close-advanced-btn');
  const advancedNavPills = document.querySelectorAll('.nav-pill-btn');
  const advancedPanels = document.querySelectorAll('.advanced-panel');

  function openAdvancedTools(toolName = 'pitches') {
    if (!advancedBackdrop) return;
    updatePitchDisplay();
    updateHitTeamUI();
    updateBoxScoreTable();
    updateRecapCard();

    switchAdvancedTool(toolName);

    advancedBackdrop.classList.add('open');
    advancedBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeAdvancedTools() {
    if (!advancedBackdrop) return;
    advancedBackdrop.classList.remove('open');
    advancedBackdrop.setAttribute('aria-hidden', 'true');
  }

  function switchAdvancedTool(toolName) {
    advancedNavPills.forEach((pill) => {
      const active = pill.getAttribute('data-tool') === toolName;
      pill.classList.toggle('active', active);
    });

    advancedPanels.forEach((panel) => {
      const active = panel.id === `panel-${toolName}`;
      panel.classList.toggle('active', active);
    });

    if (toolName === 'finish') {
      updateRecapCard();
    }
  }

  if (advancedToolsTabBtn) {
    advancedToolsTabBtn.addEventListener('click', () => {
      openAdvancedTools('pitches');
    });
  }

  if (closeAdvancedBtn) {
    closeAdvancedBtn.addEventListener('click', closeAdvancedTools);
  }

  if (advancedBackdrop) {
    advancedBackdrop.addEventListener('click', (e) => {
      if (e.target === advancedBackdrop) {
        closeAdvancedTools();
      }
    });
  }

  advancedNavPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const tool = pill.getAttribute('data-tool');
      if (tool) switchAdvancedTool(tool);
    });
  });

  // Close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (advancedBackdrop && advancedBackdrop.classList.contains('open')) closeAdvancedTools();
    }
  });

  // Initial renders
  updateInningDisplay();
  updateOutsDisplay();
  updateTimerUI();
  updateBoxScoreTable();
  updatePitchDisplay();
  updateHitTeamUI();
  renderHitLogList();
  updateRecapCard();
});

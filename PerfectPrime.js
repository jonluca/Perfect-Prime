let options = {};
chrome.runtime.onMessage.addListener(onMessage);

const MAX_TRIES_MONITOR_SKIP = 10;

function onMessage(message, sender, sendResponse) {
  if (message.action === 'optionsChanged') {
    options = message.options;
  }
}

$(_ => {
  loadOptions(receivedOptions => {
    options = receivedOptions;
    startHelper();
    window.onhashchange = function () {
      startHelper();
      console.log('hashchange');
    };
  });
});

function startMonitoringForSelectors(selectors, numTries) {
  const monitor = new MutationObserver(_ => {
    let selector = selectors.join(', ');
    for (const elem of document.querySelectorAll(selector)) {
      elem.click();
    }
  });

  let domEntry = document.getElementById("dv-web-player");
  if (domEntry) {
    /*Start monitoring at react's entry point*/
    monitor.observe(domEntry, {
      attributes: false, // Don't monitor attribute changes
      childList: true, // Monitor direct child elements (anything observable) changes
      subtree: true // Monitor all descendants
    });
  } else {
    if (numTries > MAX_TRIES_MONITOR_SKIP) {
      return;
    }
    numTries++;
    setTimeout(_ => {
      startMonitoringForSelectors(selectors, numTries);
    }, 100 * numTries);
  }
}

function startHelper() {
  let selectors = [];

  if (options.skipTitleSequence) {
    enableSkipTitleSequence(selectors);
  }

  if (options.autoPlayNext) {
    enableAutoPlayNext(selectors);
  }

  if (options.skipRecap) {
    /* Skip if still watching*/
    enableSkipRecap(selectors);
  }

  if (options.skipAds) {
    /* Skip if still watching*/
    enableSkipAds(selectors);
  }

  if (options.watchCredits) {
    watchCredits(selectors);
  }

  startMonitoringForSelectors(selectors, 0);
}

function enableAutoPlayNext(selectors) {
  /*Skip title sequence*/
  selectors.push('.nextUpCard > .playIconWrapper > .playIcon');
}

function enableSkipTitleSequence(selectors) {
  /*Skip title sequence*/
  selectors.push('[aria-label="Skip Intro"]');
}

function enableSkipRecap(selectors) {
  /*Skip title sequence*/
  selectors.push('.skipElement');
}

function enableSkipAds(selectors) {
  /*Skip title sequence*/
  selectors.push('.adSkipButton');
}

function watchCredits(selectors) {
  /*Skip title sequence*/
  selectors.push('.nextUpHideText');
}

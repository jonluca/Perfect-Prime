let options;
let fuse;

$(() => {
  const manifestData = chrome.runtime.getManifest();
  $("#version").text(manifestData.version);

  $('body').on('click', 'a', function () {
    if (this && $(this).attr('href')) {
      chrome.tabs.create({url: $(this).attr('href')});
    }
    return false;
  });
  loadOptions(function (recOptions) {
    options = recOptions;
    // Set values on page to those saved
    $("#chkTitleSequence").prop('checked', options.skipTitleSequence);
    $("#chkSkipRecaps").prop('checked', options.skipRecap);
    $("#chkPlayNext").prop('checked', options.autoPlayNext);
    $("#chkWatchCredits").prop('checked', options.watchCredits);
    $("#chkSkipAds").prop('checked', options.skipAds);

    if (options.highContrast) {
      $("#contrast").text("Normal Contrast Mode");
      $("#contrast").attr('data-value', "high");
    } else {
      $("#contrast").text("High Contrast Mode");
      $("#contrast").attr('data-value', "low");
    }

    // Trigger gumby update to show visual changes
    $('input:checked').trigger('gumby.check');

    $('input').parent().on('gumby.onChange', function () {
      changeOption(this);
    });

    registerContrastModeHandler();
    setContrastMode();
  });
});

function registerContrastModeHandler() {
  $("#contrast").click(e => {
    if ($("#contrast").attr('data-value') === "high") {
      $("#contrast").attr('data-value', "low");
      options.highContrast = false;
      $("#contrast").text("High Contrast Mode");
    } else {
      $("#contrast").attr('data-value', "high");
      options.highContrast = true;
      $("#contrast").text("Normal Contrast Mode");
    }
    saveOptions();
    setContrastMode();
  });
}

function setContrastMode() {
  if (options.highContrast) {
    $("body").addClass("high-contrast");
    $("a").addClass("high-contrast");
    $("#genreSearch").addClass("high-contrast");
    $(".checkBackground").addClass("high-contrast");
    $(".checkBackground").removeClass("checkBackground");
  } else {
    $("body").removeClass("high-contrast");
    $("a").removeClass("high-contrast");
    $(".high-contrast").addClass("checkBackground");
    $("#genreSearch").removeClass("high-contrast");
    $(".high-contrast").removeClass("high-contrast");
  }
}

function constructResultDiv(elem) {
  return `<div class='entry'><a href="${elem.link}">${elem.genre}</a></div>`;
}

function changeOption(elem) {
  switch (elem.htmlFor) {
    case "chkTitleSequence":
      options.skipTitleSequence = $('#chkTitleSequence')[0].checked;
      break;
    case "chkPlayNext":
      options.autoPlayNext = $('#chkPlayNext')[0].checked;
      if (options.autoPlayNext && options.watchCredits) {
        options.watchCredits = false;
        // Uncheck the watch credits checkbox, as you can't both watch the credits and skip them
        $('#chkWatchCredits').click();
      }
      break;
    case "chkSkipRecaps":
      options.skipRecap = $('#chkSkipRecaps')[0].checked;
      break;
    case "chkWatchCredits":
      options.watchCredits = $('#chkWatchCredits')[0].checked;
      if (options.autoPlayNext && options.watchCredits) {
        options.autoPlayNext = false;
        // Uncheck the auto play next checkbox, as you can't both watch the credits and skip them
        $("#chkPlayNext").click();
      }
      break;
    case "chkSkipAds":
      options.skipAds = $('#chkSkipAds')[0].checked;
      break;
  }
  saveOptions();

}

function saveOptions() {
  console.log(options);
  chrome.storage.sync.set({
    'options': options
  }, () => {
    sendOptions(options);
  });
}

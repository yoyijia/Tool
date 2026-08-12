chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {
      /* older chrome */
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "FETCH_PAGE" || typeof message.url !== "string") {
    return false;
  }

  (async () => {
    try {
      const res = await fetch(message.url, {
        redirect: "follow",
        headers: {
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!res.ok) {
        sendResponse({ ok: false, error: `HTTP ${res.status} for ${message.url}` });
        return;
      }
      const html = await res.text();
      sendResponse({ ok: true, html, finalUrl: res.url });
    } catch (err) {
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Fetch failed",
      });
    }
  })();

  return true; // async response
});

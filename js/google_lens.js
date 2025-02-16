function base64ToBlob(base64, type) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: type });
}

function inputImg(imgFile) {
  new MutationObserver((_, observer) => {
    const imgSearchIcon = document.querySelector("[data-base-lens-url]");
    if (!imgSearchIcon) return;
    imgSearchIcon.click();

    const input = document.querySelector("input[type='file']");
    if (!input) return;
    observer.disconnect();

    const dt = new DataTransfer();
    dt.items.add(imgFile);
    input.files = dt.files;
    input.dispatchEvent(new Event("change"));
  }).observe(document, {
    childList: true,
    subtree: true,
  });
}

function main() {
  const params = new URL(window.location.href).searchParams;
  if (!params.has("imgidx")) {
    return;
  }

  const imgidx = parseInt(params.get("imgidx"));
  try {
    chrome.runtime.sendMessage({ msg: "notification", imgidx });
  } catch (error) {
    console.log(error);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    const imgType = msg.type;
    const blob = base64ToBlob(msg.imgBase64.split(",")[1], imgType);
    const imgFile = new File([blob], `image.${imgType.split("/")[1]}`, {
      type: imgType,
    });
    inputImg(imgFile);
  });
}

main();

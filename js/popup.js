import { getDefautOption } from "./default_option.js";

let option; // 保存した設定を格納
let tabOption = "foreground"; // ページの開き方
let ctrlKey = false;
let shiftKey = false;
let zKey = false;
let shiftKeyAndAltKey = false;

document.body.addEventListener("keydown", function (e) {
  // Ctrl 或いは command
  if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
    ctrlKey = true;
  }
  // Shift
  if (e.shiftKey) {
    shiftKey = true;
  }
  // Z
  if (e.code == "KeyZ") {
    zKey = true;
  }
  // Shift と Alt
  if (e.shiftKey && e.altKey) {
    shiftKeyAndAltKey = true;
  }
});

window.onload = function () {
  chrome.storage.local.get({ option: getDefautOption() }, function (obj) {
    option = obj.option;
    console.log(option);
    var element = document.getElementById("target");
    element.onpaste = paste;
    element.focus();
    // 念の為、キーボードの判定のために設定された時間だけ待つ (デフォは100ミリ秒)
    setTimeout(() => {
      document.execCommand("paste");
    }, option.waitingTime);
  });
};

// ペースト時、画像/文字列を取得
function paste(e) {
  const items = e.clipboardData.items;
  let imageFile;
  let pasteTexts = [];
  for (var i = 0; i < items.length; i++) {
    let item = items[i];
    if (item.type.indexOf("image/") > -1) {
      // クリップボードに複数の画像が存在する場合、1つ目の画像のみ処理
      imageFile = items[i].getAsFile();
      break;
    } else if (item.type.indexOf("text/") > -1) {
      pasteTexts.push(item);
    }
  }
  if (imageFile != undefined) {
    if (option.imgSearch) {
      openPage(["image_search.html"]);
    } else {
      window.close();
    }
  } else if (pasteTexts.length > 0) {
    const plainText = pasteTexts.find((text) => text.type == "text/plain");
    const otherText = pasteTexts.find(
      (text) => text.type.indexOf("text/") > -1
    );
    if (plainText != undefined) {
      plainText.getAsString(function (value) {
        parseStr(value);
      });
    } else if (otherText != undefined) {
      try {
        otherText.getAsString(function (value) {
          parseStr(value);
        });
      } catch (e) {
        window.close();
      }
    }
  } else if (pasteTexts.length == 0) {
    let ary = [];
    if (option.urlOpen) {
      ary.push("URL");
    }
    if (option.strSearch) {
      ary.push("String");
    }
    if (option.imgSearch) {
      ary.push("Image");
    }
    if (ary.length > 0) {
      const notice = ary.join("/") + " not found from your clipboard data.";
      document.body.innerHTML = "<span>" + notice + "</span>";
    }
  }
}

// 文字列の解析
function parseStr(clipboardStr) {
  console.log(clipboardStr);
  const notice = "<span>please wait...</span>";
  document.body.innerHTML = notice;

  // 両方の設定が無効の場合は終了する
  if (!option.openUrl && !option.strSearch) {
    window.close();
    return;
  }

  // URLの抽出/検索URLの作成
  let obtainedUrls = [];
  if (option.parseLineByLine_shiftAlt && shiftKeyAndAltKey) {
    // 一行毎に解析する場合 (Shift + Alt)
    tabOption = "foreground";
    const strs = clipboardStr.split(/\r\n|\r|\n/g);
    for (const str of strs) {
      if (str === "") {
        continue;
      }
      let urls = [];
      if (option.openUrl) {
        urls = extractURL(str);
      }
      if (urls.length == 0 && option.strSearch) {
        urls = getSearchURL(str, false);
      }
      if (urls.length > 0) {
        obtainedUrls = obtainedUrls.concat(urls);
      }
    }
  } else {
    // Shift + Alt を押していない場合
    let urls = [];
    if (option.openUrl && !ctrlKey) {
      urls = extractURL(clipboardStr);
      if (urls.length > 0) {
        tabOption = option.tabForUrl;
      }
    }
    if (urls.length == 0 && option.strSearch) {
      urls = getSearchURL(clipboardStr, true);
      if (urls.length > 0) {
        tabOption = option.tabForSearch;
      }
    }
    if (urls.length > 0) {
      obtainedUrls = obtainedUrls.concat(urls);
    }
  }

  // URLを調整
  if (obtainedUrls.length > 0) {
    adjustURL(obtainedUrls);
  } else {
    window.close();
  }
}

// URLの抽出
function extractURL(str) {
  // http/https/h抜き のURLの抽出
  let urlRegex;
  if (option.ttpUrl) {
    urlRegex = getUrlRegex("h?ttps?://");
  } else {
    urlRegex = getUrlRegex("https?://");
  }
  let urls = str.match(urlRegex);
  if (urls == null) {
    urls = [];
  }

  // 拡張機能のURLの抽出
  if (option.extensionUrl) {
    const extensionUrlRegex = getUrlRegex("(chrome-)?extension://");
    const extensionUrls = str.match(extensionUrlRegex);
    if (extensionUrls != null) {
      urls = urls.concat(extensionUrls);
    }
  }

  // ファイルのURL (file:///) の抽出
  if (option.fileUrl) {
    const fileUrlRegex = getUrlRegex("file:///");
    const fileUrls = str.match(fileUrlRegex);
    if (fileUrls != null) {
      urls = urls.concat(fileUrls);
    }
  }

  // 任意のスキームを用いたURLの抽出
  if (option.anySchemes && option.schemes != "") {
    const schemes = option.schemes.split(",");
    for (const scheme of schemes) {
      const anySchemeUrlRegex = getUrlRegex(scheme + "(:|://)");
      const anySchemeUrls = str.match(anySchemeUrlRegex);
      if (anySchemeUrls != null) {
        urls = urls.concat(anySchemeUrls);
        /* 
                    例えばview-sourceのURLがクリップボードにあったとして、
                    後ろがhttpのURLだったりした場合はそれを抽出してしまっているため、
                    そのような場合にurls配列から1つ消す。
                */
        for (const url of anySchemeUrls) {
          const regexStr = "^" + scheme + "(:|://)";
          const strAfterScheme = url.replace(new RegExp(regexStr), "");
          const urlCount = urls.filter((url) => url == strAfterScheme).length;
          if (urlCount > 0) {
            urls.splice(urls.indexOf(strAfterScheme), 1);
          }
        }
      }
    }
  }

  return urls;
}

function getUrlRegex(schemeRegexStr) {
  let regexStr = "";

  if (option.userRegex) {
    // ユーザーが正規表現を定義している場合
    regexStr = option.userRegex;
    regexStr = schemeRegexStr + regexStr;
    regexStr = "(" + regexStr + ")";
    const regex = new RegExp(regexStr, "g");
    return regex;
  }

  regexStr = "\\w\\.\\-/\\?\\%&\\$!#\\*\\(\\)@~=\\+:;,'";
  if (option.addRegexes.length > 0) {
    for (const addRegex of option.addRegexes) {
      if (addRegex == "regex-unicode-rough-range") {
        regexStr += "\\u2E80-\\u2FDF\\u3001-\\u9FFF\\uF900-\\uFAFF";
        regexStr += "\\uFF01-\\uFFEF\\u20000-\\u2FFFF";
      }
    }
  }
  regexStr = "[" + regexStr + "]+";
  regexStr = schemeRegexStr + regexStr;
  regexStr = "(" + regexStr + ")";
  const regex = new RegExp(regexStr, "g");
  return regex;
}

// 検索URLの作成
function getSearchURL(str, beforeSplittingStr) {
  /* 検索エンジンの決定 */
  const googleUrl = "https://www.google.com/search?q=%s";
  let serviceUrl = googleUrl;
  if (option.searchService != googleUrl) {
    if (option.searchService == "") {
      serviceUrl = googleUrl;
    } else if (option.searchService.indexOf("%s") == -1) {
      serviceUrl = googleUrl;
    } else {
      serviceUrl = option.searchService;
    }
  }
  // 検索URLの作成
  if (beforeSplittingStr && option.parseLineByLine_shift && shiftKey) {
    // 分割前かつshiftを押した場合は、一行毎に一検索語句とする
    const searchUrls = [];
    const searchWords = str.split(/\r\n|\r|\n/g);
    for (let searchWord of searchWords) {
      if (searchWord === "") {
        continue;
      }
      const encodedSearchWord = getEncodedSearchWord(searchWord);
      const searchUrl = serviceUrl.replace("%s", encodedSearchWord);
      searchUrls.push(searchUrl);
    }
    return searchUrls;
  } else {
    // 既に文字列を分割しているか、shiftを押していない場合
    const encodedSearchWord = getEncodedSearchWord(str);
    const searchUrl = serviceUrl.replace("%s", encodedSearchWord);
    return [searchUrl];
  }
}

// 検索語句をエンコード
function getEncodedSearchWord(str) {
  if (option.exactMatch_z && zKey) {
    str = '"' + str + '"';
  }
  const encodedSearchWord = encodeURIComponent(str);
  return encodedSearchWord;
}

// URLを調整
async function adjustURL(obtainedUrls) {
  let openUrls = [];
  for (let url of obtainedUrls) {
    if (url.indexOf("ttp") == 0) {
      url = "h" + url;
    }
    if (option.imgUrlSearch) {
      let regexImgUrl = /\.(png|jpg|jpeg|gif|webp)$/;
      if (url.match(regexImgUrl)) {
        url = await getImgSearchUrlUsingImgUrl(url);
      }
    }
    openUrls.push(url);
  }
  openPage(openUrls);
}

// 画像のURLで画像検索
async function getImgSearchUrlUsingImgUrl(url) {
  let searchUrl = url;
  let serviceUrl;
  const body = new FormData();
  body.processData = false;
  body.contentType = false;
  switch (option.imgSearchService) {
    case "google":
      searchUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(
        url
      )}`;
      break;
    case "ascii2d":
      body.append("utf8", "✓");
      const token =
        "826Ypvlh4ww7awwTrMdIHeOMPA1YYjGSyKK34/qP2cPsyNMs3IqGTh8a2tWx+2oaMy9nYYx/oLg7dSmVh29Mbg==";
      body.append("authenticity_token", token);
      body.append("uri", url);
      serviceUrl = "https://ascii2d.net/search/uri";
      await axios
        .post(serviceUrl, body)
        .then((response) => {
          searchUrl = response.request.responseURL;
          if (searchUrl.indexOf("https://ascii2d.net/search/color/") == -1) {
            searchUrl = url;
          }
        })
        .catch((e) => {
          //console.log(e.toJSON());
        });
      break;
    case "tineye":
      body.append("url", url);
      serviceUrl = "https://www.tineye.com/api/v1/result_json/";
      let response = await axios
        .post(serviceUrl, body)
        .then((response) => {
          return response.data;
        })
        .catch((e) => {
          // console.log(e.toJSON());
        });
      if (response && response.query_hash) {
        searchUrl = "https://tineye.com/search/" + response.query_hash;
      }
      break;
    case "yandex":
      searchUrl = "https://yandex.com/images/search?rpt=imageview&url=";
      searchUrl += encodeURIComponent(url);
      break;
  }
  return searchUrl;
}

// URLを開く
function openPage(urls) {
  console.log(urls);
  //return;
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    //console.log(tabs[0]);
    urls.forEach(function (url, i) {
      if (
        i == 0 &&
        tabs[0].url.indexOf("://newtab/") != -1 &&
        option.checkNewTab
      ) {
        // 1つ目のURLかつ現在のタブが新しいタブの場合
        chrome.tabs.update({ url: url });
      } else if (i == 0 && tabOption == "current") {
        // 1つ目のURLかつタブの設定が現在のタブの場合
        chrome.tabs.update({ url: url });
      } else if (
        i == 0 &&
        tabOption == "foreground" &&
        option.openFirstPageForeground
      ) {
        // 最初に開くタブがアクティブ
        chrome.tabs.create({ url: url, active: true });
      } else {
        if (
          i == urls.length - 1 &&
          tabOption == "foreground" &&
          !option.openFirstPageForeground
        ) {
          // 最後に開くタブがアクティブ
          chrome.tabs.create({ url: url, active: true });
        } else {
          // 上に該当しない場合は新しいバックグラウンドタブで開く
          chrome.tabs.create({ url: url, active: false });
        }
      }
    });
  });
  window.close();
}

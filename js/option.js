import { getDefautOption } from "./default_option.js";
const manifestData = chrome.runtime.getManifest();
const googleSearchUrl = "https://www.google.com/search?q=%s";
const regexStr = "[\\w\\.\\-/\\?\\%&\\$!#\\*\\(\\)@~=\\+:;,']+"

$(document).ready(function () {
    // messages.jsonの内容を反映
    setMessage();
    // 一部要素を複製
    copyElements();
    // フッターを調整
    setFooter();
    // ページ初回表示時は設定を保存し、初回以外はページに反映
    chrome.storage.local.get("option", function (obj) {
        if (obj.option == undefined) {
            resetOptions();
        } else {
            restoreOptions(obj.option)
        }
    });
});

// 設定をページに反映
function restoreOptions(option) {
    console.log(option);
    ////////////////////// URL //////////////////////
    if (!option.openUrl) {
        $("#open-url").prop("checked", false);
    }
    if (option.tabForUrl != "foreground") {
        $("#open-url-inner select.page-open-tab").val(option.tabForUrl);
    }
    if (!option.ttpUrl) {
        $("#ttp-url").prop("checked", false);
    }
    if (!option.extensionUrl) {
        $("#extension-url").prop("checked", false);
    }
    if (!option.fileUrl) {
        $("#file-url").prop("checked", false);
    }
    if (!option.anySchemes) {
        $("#any-schemes").prop("checked", false);
    }
    if (option.schemes != "") {
        $("#schemes").val(option.schemes);
    }
    if (option.imgUrlSearch) {
        $("#img-url-search").prop("checked", true);
    }
    if (option.addRegexes.length > 0) {
        for (const addRegex of option.addRegexes) {
            $("#" + addRegex).prop("checked", true);
        }
    }
    if (option.userRegex != null) {
        $("#user-regex-checkbox").prop("checked", true);
        $("#user-regex-text").prop("disabled", false);
        $("#add-regex-inner [type='checkbox']").prop("disabled", true);
        $("#user-regex-text").val(option.userRegex);
    }
    ////////////////////// 検索 //////////////////////
    if (!option.strSearch) {
        $("#str-search").prop("checked", false);
    }
    if (option.tabForSearch != "foreground") {
        $("#str-search-inner select.page-open-tab").val(option.tabForSearch);
    }
    if (option.searchService != googleSearchUrl) {
        $("#search-service").val(option.searchService);
    }
    if (!option.urlAsKeyword_ctrl) {
        $("#url-as-keyword").prop("checked", false);
    }
    if (!option.parseLineByLine_shift) {
        $("#parse-line-by-line-shift").prop("checked", false);
    }
    if (!option.exactMatch_z) {
        $("#exact-match").prop("checked", false);
    }
    ////////////////////// 画像検索 //////////////////////
    if (!option.imgSearch) {
        $("#img-search").prop("checked", false);
    }
    if (option.imgSearchService != "google") {
        $("#img-search-service").val(option.imgSearchService);
    }
    if (!option.imgConvertForYandex) {
        $("#img-convert-for-yandex").prop("checked", false);
    }
    ////////////////////// その他 //////////////////////
    if (!option.checkNewTab) {
        $("#check-newtab").prop("checked", false);
    }
    if (!option.openFirstPageForeground) {
        $("#open-first-page-foreground").prop("checked", false);
    }
    if (!option.parseLineByLine_shiftAlt) {
        $("#parse-line-by-line-shift-alt").prop("checked", false);
    }
    if (option.waitingTime != 100) {
        $("#waiting-time").val(option.waitingTime);
    }
}

// 保存ボタンが押された時に設定を保存
$(document).on("click", ".save-button", function () {
    ////////////////////// URL //////////////////////
    const openUrl = $("#open-url").prop("checked");
    const tabForUrl = $("#open-url-inner select.page-open-tab").val();
    const ttpUrl = $("#ttp-url").prop("checked");
    const extensionUrl = $("#extension-url").prop("checked");
    const fileUrl = $("#file-url").prop("checked");
    const anySchemes = $("#any-schemes").prop("checked");
    const schemes = $("#schemes").val();
    const imgUrlSearch = $("#img-url-search").prop("checked");
    ////////////////////// 検索 //////////////////////
    const strSearch = $("#str-search").prop("checked");
    const tabForSearch = $("#str-search-inner select.page-open-tab").val();
    const searchService = $("#search-service").val();
    const urlAsKeyword_ctrl = $("#url-as-keyword").prop("checked");
    const parseLineByLine_shift = $("#parse-line-by-line-shift").prop("checked");
    const exactMatch_z = $("#exact-match").prop("checked");
    ////////////////////// 画像検索 //////////////////////
    const imgSearch = $("#img-search").prop("checked");
    const imgSearchService = $("#img-search-service").val();
    const imgConvertForYandex = $("#img-convert-for-yandex").prop("checked");
    ////////////////////// その他 //////////////////////
    const checkNewTab = $("#check-newtab").prop("checked");
    const openFirstPageForeground = $("#open-first-page-foreground").prop("checked");
    const parseLineByLine_shiftAlt = $("#parse-line-by-line-shift-alt").prop("checked");
    let waitingTime = $("#waiting-time").val();
    waitingTime = Number(waitingTime);
    if (Number.isNaN(waitingTime)) {
        waitingTime = 100;
        $("#waiting-time").val(100);
    }
    const addRegexes = [];
    let userRegex = null;
    const addRegexCheckboxes = $("#add-regex-inner [type='checkbox']");
    if (!addRegexCheckboxes.prop("disabled")) {
        $(addRegexCheckboxes).each(function (_, regexChangebox) {
            if ($($(regexChangebox)[0]).prop("checked")) {
                addRegexes.push($(regexChangebox)[0].id)
            }
        })
    } else {
        const regexText = $("#user-regex-text").val();
        if (regexText != "") {
            userRegex = regexText;
        } else {
            $("#user-regex-text").val(regexStr);
            userRegex = regexStr;
        }
    }
    /////////////////////////////////////////////////
    const option = {
        "openUrl": openUrl,
        "tabForUrl": tabForUrl,
        "ttpUrl": ttpUrl,
        "extensionUrl": extensionUrl,
        "fileUrl": fileUrl,
        "anySchemes": anySchemes,
        "schemes": schemes,
        "imgUrlSearch": imgUrlSearch,
        "strSearch": strSearch,
        "tabForSearch": tabForSearch,
        "searchService": searchService,
        "urlAsKeyword_ctrl": urlAsKeyword_ctrl,
        "parseLineByLine_shift": parseLineByLine_shift,
        "exactMatch_z": exactMatch_z,
        "imgSearch": imgSearch,
        "imgSearchService": imgSearchService,
        "imgConvertForYandex": imgConvertForYandex,
        "checkNewTab": checkNewTab,
        "openFirstPageForeground": openFirstPageForeground,
        "parseLineByLine_shiftAlt": parseLineByLine_shiftAlt,
        "waitingTime": waitingTime,
        "addRegexes": addRegexes,
        "userRegex": userRegex
    }
    chrome.storage.local.set({
        "option": option
    }, function () {
        console.log("設定の保存完了");
        console.log(option);
    });
});

// リセットボタンが押された時に設定をリセット
$(document).on("click", ".reset-button", function () {
    resetOptions();
});

// 設定をリセット
function resetOptions() {
    const option = getDefautOption();
    ////////////////////// URL //////////////////////
    $("#open-url").prop("checked", true);
    $("#open-url-inner select.page-open-tab").val("foreground");
    $("#ttp-url").prop("checked", true);
    $("#extension-url").prop("checked", true);
    $("#file-url").prop("checked", true);
    $("#any-schemes").prop("checked", true);
    $("#schemes").val(option.schemes);
    $("#img-url-search").prop("checked", false);
    ////////////////////// 検索 //////////////////////
    $("#str-search").prop("checked", true);
    $("#str-search-inner select.page-open-tab").val("foreground");
    $("#search-service").val(googleSearchUrl);
    $("#url-as-keyword").prop("checked", true);
    $("#parse-line-by-line-shift").prop("checked", true);
    $("#exact-match").prop("checked", true);
    ////////////////////// 画像検索 //////////////////////
    $("#img-search").prop("checked", true);
    $("#img-search-service").val("google");
    $("#img-convert-for-yandex").prop("checked", true);
    ////////////////////// その他 //////////////////////
    $("#check-newtab").prop("checked", true);
    $("#open-first-page-foreground").prop("checked", true);
    $("#parse-line-by-line-shift-alt").prop("checked", true);
    $("#waiting-time").val(100);
    $("#add-regex-inner [type='checkbox']").prop("checked", false);
    $("#add-regex-inner [type='checkbox']").prop("disabled", false);
    $("#user-regex-checkbox").prop("checked", false);
    $("#user-regex-text").prop("disabled", true);
    $("#user-regex-text").val(regexStr);
    /////////////////////////////////////////////////
    chrome.storage.local.clear();
    chrome.storage.local.set({
        "option": option
    }, function () {
        console.log("設定のリセット完了");
        console.log(option);
    });
}

// 正規表現関連の設定を変更可能/不可にする
$("input[type='checkbox']").on("change", function (e) {
    const id = e.target.id;
    const status = $(e.target).prop("checked");
    if (id == "user-regex-checkbox") {
        if (status) {
            $("#user-regex-text").prop("disabled", false);
            $("#add-regex-inner [type='checkbox']").prop("disabled", true);
        } else {
            $("#user-regex-text").prop("disabled", true);
            $("#add-regex-inner [type='checkbox']").prop("disabled", false);
        }
    }
})

// messages.jsonの内容を反映
function setMessage() {
    const i18nKeys = [
        // 保存, リセットボタン
        "optionSave",
        "optionReset",
        // ページの開き方
        "howToOpenaPage",
        "currentTab",
        "newForegroundTab",
        "newBackgroundTab",
        // URL
        "optionClipboardIsUrl",
        "optionUrlWithoutH",
        "optionExtensionScheme",
        "optionFileScheme",
        "optionAnyScheme",
        "optionAnySchemeDesc",
        "optionImgUrlSearch",
        "optionImgUrlSearchDesc",
        "optionAddRegexes",
        "optionRegexRoughRange",
        "optionUserRegex",
        "optionUserRegexDesc",
        // 検索
        "optionClipboardIsStr",
        "optionSearchEngine",
        "optionSearchEngineDesc",
        "optionUrlAsKeyword_ctrl",
        "optionParseLineByLine_shift",
        "optionExactMatch_z",
        // 画像検索
        "optionClipboardIsImage",
        "optionImageSearchEngine",
        "optionGoogleImageSearch",
        "optionAscii2dImageSearch",
        "optionTinEyeImageSearch",
        "optionYandexImageSearch",
        "optionImageConvertForYandex",
        "optionImageConvertForYandexDesc",
        // その他
        "optionCurrentTabIsNewTab",
        "optionOpenFirstPageForeground",
        "optionOpenFirstPageForegroundDesc",
        "optionParseLineByLine_shiftAlt",
        "optionParseLineByLine_shiftAltDesc",
        "optionWaitingTime",
        "optionMillisecond",
        "optionWaitingTimeDesc"
    ];
    for (const key of i18nKeys) {
        appendMessage(key);
    }
    $("body").css("visibility", "visible");
}

// messages.jsonからmessageを取得
function getMessage(key) {
    if (!key) {
        return "";
    }
    let message = chrome.i18n.getMessage(key);
    if (message) {
        return message.replace(/(\\n)/g, "<br>");
    } else {
        return key;
    }
}

// messageを反映
function appendMessage(key) {
    $("[data-i18n='" + key + "']").append(getMessage(key));
}

// 一部要素を複製
function copyElements() {
    // 保存,リセットボタン
    const buttonWrapper = $(".button-wrapper")[0];
    $("footer").before($(buttonWrapper).clone());
    // ページの開き方
    $(".replace_page-open-tab-wrapper").replaceWith($(".page-open-tab-wrapper").clone());
}

// フッターに拡張機能の名前とバージョンを表示
function setFooter() {
    const footerStr = manifestData.name + " v" + manifestData.version;
    $($("footer")[0]).append("<div>" + footerStr + "</div>");
}
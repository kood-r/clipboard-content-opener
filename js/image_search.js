import { getDefautOption } from "./default_option.js";

let option; // 保存した設定を格納
let imageFiles = []; // クリップボードから取得した画像
let imageSearchUrls = []; // 検索結果のURL

window.onload = function () {
    chrome.storage.local.get({ "option": getDefautOption() }, function (obj) {
        option = obj.option;
        console.log(option);
        var element = document.querySelector("[contenteditable]");
        element.onpaste = paste;
        element.focus();
        document.execCommand("paste");
    });
}

// ペースト時、画像を取得
function paste(e) {
    const items = e.clipboardData.items;
    for (var i = 0; i < items.length; i++) {
        let item = items[i];
        if (item.type.indexOf("image/") > -1) {
            imageFiles.push(items[i].getAsFile())
        }
    }
    if (imageFiles.length > 0) {
        $("img").ready(function () {
            // img要素がDOMに反映されるのを待ってフォーカスを外す
            $("#target").blur();
            $("#target").hide();
        })
        setCanvas();
    }
}

// 画像をcanvasに描画
async function setCanvas() {
    console.log(imageFiles);
    if (imageFiles.length == 1) {
        const canvas = await createCanvas(imageFiles[0], 600);
        $("#content").append(canvas);
    } else {
        $("#content").append("<table>");
        $("table").append("<tr>");
        $("tr").append("<th id='th-image'>Image</th><th id='th-url-mes'>URL / Message</th>")
        for (const imageFile of imageFiles) {
            $("table").append("<tr>");
            const canvas = await createCanvas(imageFile, 100);
            $("tr:last").append("<td>");
            $("td:last").append(canvas);
            $("tr:last").append("<td>");
        }
    }
    imageSearch();
}

async function createCanvas(imageFile, canvasWidth) {
    const c = document.createElement("canvas");
    const bitmap = await createImageBitmap(imageFile);
    c.width = bitmap.width;
    c.height = bitmap.height;
    if (bitmap.width > canvasWidth) {
        const r = canvasWidth / bitmap.width;
        c.width = canvasWidth;
        c.height = bitmap.height * r;
        c.getContext("2d").drawImage(bitmap, 0, 0, canvasWidth, c.height);
    } else {
        c.getContext("2d").drawImage(bitmap, 0, 0);
    }
    return c;
}

// 画像をアップロードし、検索結果のURLを取得する
async function imageSearch() {
    const resultObj = {};
    const pleaseWait = getMessage("pleaseWait");
    for (let i = 0; i < imageFiles.length; i++) {
        // pleaseWaitのメッセージを出力
        let html = "";
        const td = $($($("tr")[i + 1]).find("td")[1]);
        switch (option.imgSearchService) {
            case "google":
                html = getMessage("uploadingImgToGoogle");
                break;
            case "ascii2d":
                html = getMessage("uploadingImgToAscii2d")
                break;
            case "tineye":
                html = getMessage("uploadingImgToTinEye")
                break;
            case "yandex":
                html = getMessage("uploadingImgToYandex")
                break;
        }
        html = "<span>" + html + "<br>" + pleaseWait + "</span>";
        if ($("table").length == 0) {
            $("#content").prepend(html);
        } else {
            td.append(html)
        }

        // アップロードして検索結果のURLを取得
        const obj = await uploadImage(imageFiles[i]);
        console.log(obj);

        // テーブルの場合はリンクを出力
        if (obj["url"]) {
            imageSearchUrls.push(obj["url"]);
            if ($("table").length) {
                td.empty();
                const link = "<a href='" + obj["url"] + "' target='_blank'>Result Link</a>"
                td.append(link);
            }
        }

        // エラーが発生した場合はエラー内容を出力
        if (obj["error"] || obj["errorMes"]) {
            td.empty();
            let error = "";
            let errorMes = ""
            let notice = "";
            if (obj["error"]) error = obj["error"];
            if (obj["errorMes"]) errorMes = obj["errorMes"];
            if (obj["notice"]) notice = obj["notice"];
            html = errorMes + "<br>" + error + "<br>" + notice;
            html = "<span>" + html + "</span>";
            if ($("table").length) {
                td.append(html)
            } else {
                $("#content span").remove();
                $("#content").prepend(html);
            }
        }

        // 結果をresultObjに格納
        resultObj["img" + i] = obj;
    }

    console.log(resultObj);
    // URLを開く
    if (imageSearchUrls.length) {
        if ($("table").length) {
            if (Object.keys(resultObj).length == imageSearchUrls.length) {
                openPage("current");
            } else {
                // テーブルかつエラーが1つでも存在する場合はバックグラウンドタブでURLを開く
                let html = getMessage("openBackgroundTab_afterImgSearchFinished");
                html = "<span>" + html + "</span>";
                $("#content").prepend(html);
                openPage("background");
            }
        } else {
            openPage("current");
        }
    }
}

// アップロードして検索結果のURLを取得
async function uploadImage(imageFile) {
    const obj = {};
    let response, serviceUrl;

    // 拡張子を取得してファイル名を決定する
    let imageExtension = imageFile.type.match(/\/[a-zA-Z]{1,}/)[0];
    imageExtension = imageExtension.replace("/", "");
    const fileName = "image." + imageExtension;

    // FormDataオブジェクトの準備
    const body = new FormData();
    body.processData = false;
    body.contentType = false;

    // アップロードして検索結果のURLを取得
    switch (option.imgSearchService) {
        case "google":
            serviceUrl = "https://www.google.com/searchbyimage/upload";
            body.append("encoded_image", imageFile, fileName);
            await axios.post(serviceUrl, body).then(response => {
                obj["url"] = response.request.responseURL;
            }).catch(e => {
                console.log(e.toJSON());
                if (e.message) {
                    obj["error"] = e.message;
                }
                obj["errorMes"] = getMessage("errorOnUploadToGoogle");
                console.log();
            });
            break;
        case "ascii2d":
            serviceUrl = "https://ascii2d.net/search/file";
            body.append("file", imageFile, fileName);
            await axios.post(serviceUrl, body).then(response => {
                obj["url"] = response.request.responseURL;
            }).catch(e => {
                console.log(e.toJSON());
                if (e.message) {
                    obj["error"] = e.message;
                }
                obj["errorMes"] = getMessage("errorOnUploadToAscii2d");
            });
            break;
        case "tineye":
            serviceUrl = "https://tineye.com/result_json/";
            body.append("image", imageFile, fileName);
            response = await axios.post(serviceUrl, body).then(response => {
                return response.data;
            }).catch(e => {
                console.log(e.toJSON());
                if (e.response.data) {
                    return e.response.data;
                } else {
                    if (e.message) {
                        obj["error"] = e.message;
                    }
                    obj["errorMes"] = getMessage("errorOnUploadToTinEye");
                }
            });
            if (obj["error"]) {
                break;
            }
            console.log(response);
            if (response.query_hash) {
                obj["url"] = "https://tineye.com/search/" + response.query_hash;
            } else {
                try {
                    obj["error"] = response.suggestions.description[0];
                } catch (e) { }
                obj["errorMes"] = getMessage("errorOnUploadToTinEye");
            }
            break;
        case "yandex":
            let converted = false;
            if (option.imgConvertForYandex && imageExtension == "png") {
                // Yandexと相性の悪いPNGが存在するため、PNGに再変換して対処
                try {
                    let png = "";
                    if ($("table").length == 0) {
                        png = $("canvas")[0].toDataURL("image/png");
                    } else {
                        const canvas = await createCanvas(imageFile, 600);
                        png = canvas.toDataURL("image/png");
                    }
                    png = png.replace(/^.*,/, "");
                    imageFile = await convertImage(png);
                    converted = true;
                } catch (e) { }
            }
            body.append("upfile", imageFile, fileName);
            serviceUrl = 'https://yandex.com/images/touch/search?rpt=imageview&format=json&request={"blocks":[{"block":"cbir-uploader__get-cbir-id"}]}';
            response = await axios.post(serviceUrl, body).then(response => {
                return response.data;
            }).catch(e => {
                console.log(e.toJSON());
                if (e.message) {
                    obj["error"] = e.message;
                }
                obj["errorMes"] = getMessage("errorOnUploadToYandex");
                obj["notice"] = getMessage("notice_Yandex1");
                if ($("table").length == 0 && !converted) {
                    obj["notice"] = obj["notice"] + "<br>" + getMessage("notice_Yandex2");
                }
            });
            if (obj["error"]) {
                break;
            }
            if (response) {
                console.log(response);
                try {
                    const origUrl = response.blocks[0].params.originalImageUrl;
                    const encodedUrl = encodeURIComponent(origUrl);
                    obj["url"] = "https://yandex.com/images/search?rpt=imageview&url=" + encodedUrl;
                } catch (e) {
                    console.log(e);
                    obj["error"] = e;
                    if (response.captcha && response.captcha["captcha-page"]) {
                        const captchaUrl = response.captcha["captcha-page"];
                        const captchaLink = "(<a href='" + captchaUrl + "' target='_blank'>CAPTCHA</a>)";
                        obj["error"] = obj["error"] + "<br>" + captchaLink;
                    }
                    obj["errorMes"] = getMessage("errorOnUploadToYandex");
                }
            }
            break;
    }
    return obj;
}

/* png -> blob -> file */
async function convertImage(png) {
    const bin = atob(png);
    let buffer = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: "image/png" });
    const imageFile = new File([blob], "image.png", { type: "image/png" });
    return imageFile;
}

// URLを開く
function openPage(tabOption) {
    //return;
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
        imageSearchUrls.forEach(function (url, i) {
            if (i == 0 && tabOption == "current") {
                chrome.tabs.update({ url: url });
            } else {
                if (i == imageSearchUrls.length - 1 && tabOption == "current" && !option.openFirstPageForeground) {
                    chrome.tabs.create({ url: url, active: true });
                } else {
                    chrome.tabs.create({ url: url, active: false });
                }
            }
        });
    });
}

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
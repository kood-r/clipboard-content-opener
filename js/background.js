import { getDefautOption } from "./default_option.js";

chrome.runtime.onInstalled.addListener(function () {
  checkOptions();
});

function checkOptions() {
  return new Promise(function (resolve) {
    chrome.storage.local.get("option", function (obj) {
      if (obj.option == undefined) {
        // 存在しない場合はオプションページを開く (初回は設定の保存が行われる)
        chrome.tabs.create({ url: "option.html", active: true });
        return resolve();
      } else {
        // 拡張機能の更新でキーを追加/削除した場合に、設定を更新
        let option = obj.option;
        const defaultOption = getDefautOption();

        // 追加したキーを取得し、オブジェクトに追加
        const result1 = Object.keys(defaultOption).filter(
          (key) => Object.keys(option).indexOf(key) == -1
        );
        for (const k of result1) {
          console.log("キー  " + k + " を追加");
          option[k] = defaultOption[k];
        }

        // 削除したキーを取得し、オブジェクトから削除
        const result2 = Object.keys(option).filter(
          (key) => Object.keys(defaultOption).indexOf(key) == -1
        );
        for (const k of result2) {
          console.log("キー  " + k + " を削除");
          delete option[k];
        }

        // 追加、削除の両方が無ければ更新はしない
        if (!result1.length && !result2.length) {
          return resolve();
        }

        // 設定を更新
        chrome.storage.local.set(
          {
            option,
          },
          function () {
            console.log("設定の更新完了");
            console.log(option);
            return resolve();
          }
        );
      }
    });
  });
}

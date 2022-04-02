export function getDefautOption() {
    const option = {
        "openUrl": true, // クリップボードの内容がURLの場合はページを開く
        "tabForUrl": "foreground", // URLの場合のページの開き方
        "ttpUrl": true, // h抜き(ttp/ttps)のURLを認識する
        "extensionUrl": true, // extensionスキームを認識する
        "fileUrl": true, // fileスキームを認識する
        "anySchemes": true, // 任意のスキームを認識する
        "schemes": "chrome,view-source,about,edge,brave,vivaldi,slimjet,catsxp", // 任意のスキーム
        "imgUrlSearch": false, // 画像のURLの場合はURLで画像検索を行う
        "addRegexes": [], // URL(スキーム部分を除く)の抽出に使用する正規表現を拡張する場合に使用
        "userRegex": null, // URL(スキーム部分を除く)の抽出に使用する正規表現をユーザーが定義する場合に使用
        "strSearch": true, // クリップボードの内容が文字列の場合は検索を行う
        "tabForSearch": "foreground", // 検索の場合のページの開き方
        "searchService": "https://www.google.com/search?q=%s", // 検索エンジン
        "urlAsKeyword_ctrl": true, // CtrlでURLの抽出をせず検索を行えるようにする
        "parseLineByLine_shift": true, // 検索の場合にShiftで一行一検索語句として処理する
        "exactMatch_z": true, // 検索の場合にZで完全一致検索を行う
        "imgSearch": true, // クリップボードの内容が画像の場合は画像検索を行う
        "imgSearchService": "google", // 画像検索エンジン
        "imgConvertForYandex": true, // Yandexにアップロードする前に画像を変換する
        "checkNewTab": true, // 現在のタブが新しいタブの場合に現在のタブでページを開く
        "openFirstPageForeground": true, // 新しいフォアグラウンドタブ設定かつ複数のURLを抽出した場合に、最初に開くタブをアクティブにする
        "parseLineByLine_shiftAlt": true, // Shift + Alt で文字列を一行毎に解析する
        "waitingTime": 100, // クリップボードの内容の取得までの待機時間 (ミリ秒) 
    };
    return option;
}
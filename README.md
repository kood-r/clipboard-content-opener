# Clipboard Content Opener

クリップボードの内容が URL の場合はそのページを開き、URL 以外の文字列の場合は検索を行い、画像の場合は画像検索を行う Chrome の拡張機能。

[Chrome ウェブストア](https://chrome.google.com/webstore/detail/clipboard-content-opener/cefbnclogebmfeoofnpjcdfjokeainbb)

## 特徴

- ページの開き方(現在のタブ/新しいフォアグラウンドタブ/新しいバックグラウンドタブ)の設定有り
- 複数の URL の抽出をサポート
- h 抜き(ttp/ttps)の URL をサポート
- "chrome-extension://"、"extension://" から始まる拡張機能の URL をサポート
- "file:///" から始まるローカルファイルの URL をサポート
- 任意のスキームから始まる文字列を URL として認識可能
- 画像の URL の場合に画像検索が可能 (要設定変更)
- 日本語、漢字がエンコードされていない URL をサポート (要設定変更)
- 検索エンジンの変更をサポート (デフォルトは Google 検索)
- Ctrl / command キーを押しながら実行で URL の抽出をせずに検索が可能
- Shift キーを押しながら実行かつ検索を行う場合に、一行一検索語句として認識
- Z キーを押しながら実行かつ検索を行う場合に、完全一致検索が可能
- Shift + Alt / Shift + option キーを押しながら実行で文字列を一行毎に解析可能
- 4 つの画像検索エンジンをサポート
- クリップボードに複数の画像がある場合、全画像で画像検索を実行。

以下の画像検索エンジンをサポートしています。

- Google レンズ
- 二次元画像詳細検索
- TinEye
- Yandex

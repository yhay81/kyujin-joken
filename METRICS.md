# Product metrics

35日保持の匿名イベントから、次を確認します。

- `users`: QAを除く利用者
- `searchers`: 検索した利用者
- `successful_searches` / `no_result_searches`: 結果あり・0件の操作回数
- `year_changers`: 年度を変更した利用者
- `metric_changers`: 条件を変更した利用者
- `sort_changers`: 並び順を変更した利用者
- `comparers`: 比較へ追加した利用者
- `copiers`: 比較結果をコピーした利用者

検索語、産業、条件、年度、割合、件数はイベントに含めません。自動QAは`is_qa=1`として実利用から除外します。

```powershell
npm run metrics
```

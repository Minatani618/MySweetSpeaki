# Speaki ステートマシン（状態遷移）仕様

Speakiの行動ロジックはステートマシンで管理されています。
基本的には「待機」や「お散歩」を繰り返しますが、時間経過やユーザーの介入によって状態が遷移します。

## 状態一覧 (STATE)

- **IDLE (待機)**: 立ち止まっている状態。
- **WANDERING (お散歩)**: ランダムな地点へ移動中。
- **GIFT_LEAVING (お土産へ出発)**: お土産イベント発生。画面外へ向かう。
- **GIFT_SEARCHING (お土産探索中)**: 画面外で待機している時間。
- **GIFT_RETURNING (帰還中)**: お土産を持って画面中央へ戻る。
- **GIFT_READY (受取待ち)**: 帰還し、ユーザーが「受け取る」ボタンを押すのを待っている。
- **INTERACTING (交流中)**: ユーザーが撫でたり、アイテムを置いたりして遊んでいる状態。

## 状態遷移図

```mermaid
flowchart TD
    IDLE((IDLE:<br>待機))
    WANDERING((WANDERING:<br>お散歩))
    GIFT_LEAVING((GIFT_LEAVING:<br>お土産へ出発))
    GIFT_SEARCHING((GIFT_SEARCHING:<br>お土産探索中))
    GIFT_RETURNING((GIFT_RETURNING:<br>帰還中))
    GIFT_READY((GIFT_READY:<br>受取待ち))
    INTERACTING((INTERACTING:<br>交流中))

    IDLE -->|時間が経つ| WANDERING
    WANDERING -->|到着| IDLE
    
    IDLE -->|お土産時間| GIFT_LEAVING
    WANDERING -->|お土産時間| GIFT_LEAVING
    
    GIFT_LEAVING -->|画面外到着| GIFT_SEARCHING
    GIFT_SEARCHING -->|発見| GIFT_RETURNING
    GIFT_RETURNING -->|画面内到着| GIFT_READY
    GIFT_READY -->|受取完了/時間切れ| IDLE
    
    %% 割り込み（ユーザーのアクション）
    GIFT_LEAVING -.->|アイテム配置| INTERACTING
    GIFT_SEARCHING -.->|アイテム配置| INTERACTING
    GIFT_RETURNING -.->|アイテム配置| INTERACTING
    
    IDLE -.->|撫でる/アイテム| INTERACTING
    WANDERING -.->|撫でる/アイテム| INTERACTING
    
    INTERACTING -->|遊び終了| IDLE
    INTERACTING -->|"遊び終了(割り込み復帰)"| GIFT_LEAVING
    INTERACTING -->|"遊び終了(割り込み復帰)"| GIFT_SEARCHING
    INTERACTING -->|"遊び終了(割り込み復帰)"| GIFT_RETURNING

    style IDLE fill:#f9f,stroke:#333
    style GIFT_READY fill:#ff9,stroke:#f66
    style INTERACTING fill:#9f9,stroke:#393
```

## 割り込みと復帰 (interruptedState)

ユーザーがアイテムを配置するなどして `INTERACTING` 状態に強制遷移する際、もし Speaki が「お土産イベント中（LEAVING, SEARCHING, RETURNING）」であれば、その状態を `interruptedState` プロパティに保存します。

`INTERACTING` が終了した際、`interruptedState` に値があればその状態に戻ります。これにより、「お使いの途中でもちょっと遊ぶ」挙動を実現しています。

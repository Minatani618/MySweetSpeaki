/**
 * My Sweet Speaki - メインロジック
 */

// 状態定数の定義
const STATE = {
    // 基本的な行動
    IDLE: 'idle',
    WALKING: 'walking',

    // お土産イベント
    GIFT_LEAVING: 'gift_leaving',
    GIFT_SEARCHING: 'gift_searching',
    GIFT_RETURNING: 'gift_returning',
    GIFT_WAIT_FOR_USER_REACTION: 'gift_wait_for_user_reaction',
    GIFT_REACTION: 'gift_reaction',
    GIFT_TIMEOUT: 'gift_timeout',

    // アイテムインタラクション
    ITEM_APPROACHING: 'item_approaching',
    ITEM_ACTION: 'item_action',

    // ユーザーインタラクション
    USER_INTERACTING: 'user_interacting',

    // スピキ同士のインタラクション
    GAME_APPROACHING: 'game_approaching',
    GAME_REACTION: 'game_reaction'
};

/**
 * 統合アセット定義 (ASSETS)
 * 形式: speaki_タイプ_感情_行動_番号
 */
const ASSETS = {
    // -- Mood (状態の継続中ループ・継続するエフェクト) --
    // ---- 通常 ----
    // ------ 停止 ------
    speaki_mood_normal_idle_1: {
        imagefile: 'speaki_normal_idle_1.png',
        soundfile: 'チョワヨ.mp3', // 仮の割り当て
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'none'
    },
    speaki_mood_normal_idle_2: {
        imagefile: 'speaki_normal_idle_2.png',
        soundfile: 'アーウ.mp3', // 仮の割り当て
        text: 'ｱｰｳ',
        movePattern: 'none'
    },
    speaki_mood_normal_idle_3: {
        imagefile: 'speaki_normal_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_normal_walking_1: {
        imagefile: 'speaki_normal_walking_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_mood_normal_walking_2: {
        imagefile: 'speaki_normal_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'none'
    },
    speaki_mood_normal_walking_3: {
        imagefile: 'speaki_normal_walking_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'none'
    },
    // ---- うれしい ----
    // ------ 停止 ------
    speaki_mood_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'none'
    },
    speaki_mood_happy_idle_2: {
        imagefile: 'speaki_happy_idle_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'none'
    },
    speaki_mood_happy_idle_3: {
        imagefile: 'speaki_happy_idle_3.png',
        soundfile: 'スピキ.mp3',
        text: 'ｽﾋﾟｷ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_happy_walking_1: {
        imagefile: 'speaki_happy_walking_1.png',
        soundfile: 'チョワヨチョワヨウェガレジチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'bounce'
    },
    speaki_mood_happy_walking_2: {
        imagefile: 'speaki_happy_walking_2.png',
        soundfile: 'チョワヨチョワヨホバギチョワヨ.mp3',
        text: 'ﾁｮﾜﾖｰﾁｮﾜﾖｰ',
        movePattern: 'none'
    },
    speaki_mood_happy_walking_3: {
        imagefile: 'speaki_happy_walking_3.png',
        soundfile: 'チョワヨチョワヨスンバコッチチョワヨ.mp3',
        text: 'ﾁｮﾜﾖ-ﾁｮﾜﾖ-',
        movePattern: 'none'
    },
    // ---- 悲しい ----
    // ------ 停止 ------
    speaki_mood_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ｳｱｱ!',
        movePattern: 'shake'
    },
    speaki_mood_sad_idle_2: {
        imagefile: 'speaki_sad_idle_2.png',
        soundfile: 'デルジバゼヨ.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },
    speaki_mood_sad_idle_3: {
        imagefile: 'speaki_sad_idle_3.png',
        soundfile: 'ウアアスピキデルジバゼヨ.mp3',
        text: 'ｳｱｱ!ｽﾋﾟｷﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },
    // ------ 歩き ------
    speaki_mood_sad_walking_1: {
        imagefile: 'speaki_sad_walking_1.png',
        soundfile: 'スピキヲイジメヌンデ.mp3',
        text: 'ｽﾋﾟｷｦｲｼﾞﾒﾇﾝﾃﾞ...',
        movePattern: 'bounce'
    },
    speaki_mood_sad_walking_2: {
        imagefile: 'speaki_sad_walking_2.png',
        soundfile: 'アーウ.mp3',
        text: 'ｱｰｳ',
        movePattern: 'stretch'
    },
    speaki_mood_sad_walking_3: {
        imagefile: 'speaki_sad_walking_3.png',
        soundfile: 'デルジバゼヨ.mp3',
        text: 'ﾃﾞﾙｼﾞﾊﾞｾﾞﾖ!',
        movePattern: 'stretch'
    },

    // -- Performance --
    // ---- アイテム ----
    speaki_performance_ITEM_BabySpeaki_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_Pumpkin_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'ﾁｮﾜﾖ!',
        movePattern: 'bounce'
    },
    speaki_performance_ITEM_ToyBall_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: '完全詠唱.mp3',
        text: '完全詠唱',
        movePattern: 'bounce'
    },
    // ---- ギフト ----
    speaki_mood_happy_giftwait_1: {
        imagefile: 'speaki_happy_idle_1.png', // ギフト待機画像
        soundfile: 'チョワヨ.mp3',
        text: 'プレゼントだよ！',
        movePattern: 'bounce'
    },
    speaki_performance_happy_giftreaction_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: '完全詠唱.mp3',
        text: '完全詠唱',
        movePattern: 'bounce'
    },
    speaki_performance_sad_gifttimeout_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'ウアア.mp3',
        text: 'ぐーぐー...',
        movePattern: 'stretch'
    },
    // ---- なでなで ----
    speaki_performance_happy_idle_1: {
        imagefile: 'speaki_happy_idle_1.png',
        soundfile: 'チョワヨ.mp3',
        text: 'チョワヨ！',
        movePattern: 'bounce'
    },
    speaki_performance_sad_idle_1: {
        imagefile: 'speaki_sad_idle_1.png',
        soundfile: 'アーウ.mp3',
        text: 'アーーウ...',
        movePattern: 'shake'
    }
};

/**
 * 統合アイテム定義 (ITEMS)
 */
const ITEMS = {
    Pumpkin: {
        name: 'かぼちゃ',
        imagefile: 'item_pumpkin.png',
        soundfile: 'チョワヨ.mp3',
        text: 'わあ、カボチャだ！',
        size: 60,
        showInMenu: true,
        transform: { nextId: 'BabySpeaki', duration: 10000 }
    },
    BabySpeaki: {
        name: '赤ちゃんスピキ',
        imagefile: 'item_baby_speaki.png',
        soundfile: '完全詠唱.mp3',
        text: 'ピキッ？',
        size: 80,
        transform: { isAdult: true, duration: 20000 }
    },
    CatTower: {
        name: 'キャットタワー',
        imagefile: 'item_cat_tower.png',
        type: 'furniture',
        size: 100,
        text: '登ってみたい！',
        showInMenu: true,
        transform: { nextId: 'ToyBall', duration: 10000 }
    },
    ToyBall: {
        name: 'おもちゃのボール',
        imagefile: 'item_toy_ball.png',
        size: 40,
        text: '転がそう！',
        showInMenu: true
    },
    LuxuryPillow: {
        name: '高級枕',
        imagefile: 'item_luxury_pillow.png',
        size: 60,
        text: 'ふかふかだ...',
        ignoreReaction: true,
        showInMenu: true
    }
};

class Speaki {
    /** コンストラクタ: Speakiの初期化 */
    constructor(id, parentElement, x, y) {
        this.id = id;
        this.parentElement = parentElement;

        // 状態プロパティ
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = 160;
        this.speed = 1.5 + Math.random() * 2.5; // 1.5 〜 4.0 の範囲でランダム化
        this.state = STATE.IDLE;
        this.stateStack = [];  // 割り込まれた状態を保存するスタック

        // 好感度パラメータ (-50 〜 +50)
        this.friendship = 0;

        this.emotion = 'happy';
        this.action = 'idle';
        this.angle = 0;
        this.lastDecisionTime = 0;

        // 時間管理
        this.arrivalTime = Date.now();
        this.destinationSet = false;
        this.waitDuration = 1000 + Math.random() * 4000; // 最初もバラバラに動くようにランダム化（1~5秒）
        this.actionStartTime = 0;      // アクション開始時刻
        this.actionDuration = 0;       // アクション継続時間
        this.searchStartTime = 0;      // お土産探索開始時刻
        this.reactionStartTime = 0;    // リアクション開始時刻
        this.eventStartTime = 0;       // 汎用イベント開始時刻
        this.pettingStartTime = 0;     // なでなで開始時刻

        this.interactionType = null;   // 'move' or 'petting'

        this.facingLeft = true; // 現在向いている方向 (true: 左, false: 右)

        this.distortion = { skewX: 0, rotateX: 0, scale: 1.0 };
        this.targetDistortion = { skewX: 0, rotateX: 0, scale: 1.0 };

        // インタラクション関連
        this.isDragging = false;
        this.dragStartTime = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isActuallyDragging = false;

        // アセット管理用
        this.currentAssetKey = ''; // 現在のアセットキー
        this.currentAsset = null;  // 現在選択されているアセットデータ
        this.currentImgSrc = '';   // 現在選択されている画像パス
        this.targetItem = null;    // 現在向かっているアイテム同期用

        // DOM生成
        this.createDOM();

        // 初期アセットを適用（感情のランダム化と画像のセット）
        this._onStateChanged(this.state);
    }

    /** DOM要素の生成 */
    createDOM() {
        this.dom = {};

        const container = document.createElement('div');
        container.className = 'speaki-sprite-container';

        const img = document.createElement('img');
        img.className = 'speaki-sprite';
        // img.src はこの後の syncSpeakiDOM() で設定されるためここでは不要

        const emoji = document.createElement('div');
        emoji.className = 'speaki-emoji-overlay';

        // デバッグ用テキスト（アセット名用）
        const debugText = document.createElement('div');
        debugText.style.position = 'absolute';
        debugText.style.left = '100%';
        debugText.style.top = '50%';
        debugText.style.transform = 'translateY(-50%)';
        debugText.style.whiteSpace = 'nowrap';
        debugText.style.fontSize = '12px';
        debugText.style.color = '#fff';
        debugText.style.background = 'rgba(0,0,0,0.5)';
        debugText.style.padding = '2px 5px';
        debugText.style.borderRadius = '4px';
        debugText.style.pointerEvents = 'none';
        debugText.style.display = 'block';

        container.appendChild(img);
        container.appendChild(emoji);
        container.appendChild(debugText);
        this.parentElement.appendChild(container); // 親要素に追加

        this.dom.container = container;
        this.dom.sprite = img;
        this.dom.emoji = emoji;
        this.dom.debugText = debugText;
    }

    /** フレームごとの更新処理 */
    update(dt) {
        // 1. 表示関連（状態に関わらず毎フレーム実行）
        this._updateDistortion(dt);
        this.syncSpeakiDOM();

        // 2. ドラッグ中はAI処理を停止
        if (this.isDragging) return;

        // 3. 判断フェーズ：状況に応じてSTATEを切り替える
        this._updateStateTransition();

        // 4. 実行フェーズ：現在のSTATEに応じた行動をとる
        this._executeStateAction(dt);

        // 好感度の自然回復（マイナスの時のみ、0にゆっくり近づく）
        if (this.friendship < 0) {
            this.friendship += 0.005; // 1秒で約0.3回復するペース
            if (this.friendship > 0) this.friendship = 0;
        }

        // 好感度が「低い」または「とっても低い」場合は表情を「かなしい」に固定
        // (ただしアイテム反応中のワクワクは例外とする)
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }
    }

    /** 状態の切り替え判定（判断のみ） */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.destinationSet ? Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)) : 999;
        //const arrived = dist <= 100; // ある程度近づいたら到着とみなす（小さくすると複数のスピキが完全に重なってしまうため）
        const arrived = dist <= 10;

        switch (this.state) {
            case STATE.IDLE:
                // 好感度が「とっても低い」場合：隠れ場所から遠ければ強制的に向かう
                if (this.friendship <= -31) {
                    const hiddenX = 50;
                    const hiddenY = 100;
                    const distToHidden = Math.sqrt((this.x - hiddenX) ** 2 + (this.y - hiddenY) ** 2);
                    if (distToHidden > 100) {
                        this.state = STATE.WALKING;
                        this.targetX = hiddenX;
                        this.targetY = hiddenY;
                        this.destinationSet = true;
                        this._onStateChanged(this.state);
                        return;
                    }
                    // すでに隠れ場所付近にいる場合は、通常の待機・お散歩サイクル（周辺移動）に任せる
                }

                // お土産イベントのトリガーチェック (好感度が「とっても高い」全個体が対象)
                const timeSinceLastGift = now - window.game.lastGiftTime;
                if (this.friendship >= 31 && timeSinceLastGift >= 30000 && !window.game.giftPartner) {
                    this.state = STATE.GIFT_LEAVING;
                    window.game.giftPartner = this;
                    this._onStateChanged(this.state);
                    return;
                }

                // 通常の待機終了チェック
                const elaspedTime = now - this.arrivalTime; // 経過時間
                if (elaspedTime > this.waitDuration) {
                    this.state = STATE.WALKING;
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.WALKING:
                if (arrived) {
                    this.state = STATE.IDLE;
                    this._onStateChanged(this.state);
                    this._handleArrival(); // 到着時刻を記録し、待機を開始させる
                }
                break;

            case STATE.GIFT_LEAVING:
                if (arrived) {
                    this.state = STATE.GIFT_SEARCHING;
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.GIFT_SEARCHING:
                if (now - this.arrivalTime > 5000) { // 5秒待機で戻る
                    this.state = STATE.GIFT_RETURNING;
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.GIFT_RETURNING:
                if (arrived) {
                    this.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
                    window.game.startGiftReceiveEvent(this);
                    this.eventStartTime = now;
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                // 10秒間反応がなければタイムアウト（寝てしまう）
                if (now - this.eventStartTime > 10000) {
                    this.state = STATE.GIFT_TIMEOUT;
                    this.eventStartTime = now;
                    window.game.updateGiftUI('hide');
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.GIFT_REACTION:
                // 音声長（デフォルト3秒）喜んでから終了
                const reactionDur = this.actionDuration || 3000;
                if (now - this.eventStartTime > reactionDur) {
                    window.game.completeGiftEvent();
                    this._onStateChanged(STATE.IDLE);
                }
                break;

            case STATE.GIFT_TIMEOUT:
                // 音声長（デフォルト5秒）寝てから終了
                const timeoutDur = this.actionDuration || 5000;
                if (now - this.eventStartTime > timeoutDur) {
                    window.game.completeGiftEvent();
                    this._onStateChanged(STATE.IDLE);
                }
                break;

            case STATE.USER_INTERACTING:
                // インタラクション終了（3秒喜ぶ）は既存のタイマーに任せる、またはここで管理に移行
                break;

            case STATE.ITEM_APPROACHING:
                if (arrived) {
                    this.state = STATE.ITEM_ACTION;
                    if (this.targetItem) {
                        this._performItemAction(this.targetItem);
                    }
                    this._onStateChanged(this.state);
                }
                break;

            case STATE.ITEM_ACTION:
                // アイテムアクション終了を時間ベースで判定
                const itemActionElapsed = now - this.actionStartTime;
                const actionDur = this.actionDuration || 3000;
                if (itemActionElapsed > actionDur) {
                    this.state = STATE.IDLE;
                    this._onStateChanged(this.state);
                }
                break;
        }
    }

    /** 状態変更時のエフェクト発動（ASSETS方式） */
    _onStateChanged(newState) {
        // 1. 前の音声を停止
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice = null;
        }

        // 2. 状態に応じたアクション（action）の自動割り当て
        switch (newState) {
            case STATE.IDLE:
                const emotions = ['normal', 'happy', 'sad'];
                this.emotion = emotions[Math.floor(Math.random() * emotions.length)];
                this.action = 'idle';
                break;

            case STATE.WALKING:
                this.action = 'walking';
                break;

            case STATE.GIFT_LEAVING:
            case STATE.GIFT_RETURNING:
                this.emotion = 'happy';
                this.action = 'walking';
                break;

            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                this.emotion = 'happy';
                this.action = 'giftwait';
                break;

            case STATE.GIFT_REACTION:
                this.emotion = 'happy';
                this.action = 'giftreaction';
                break;

            case STATE.ITEM_APPROACHING:
                this.action = 'walking';
                break;

            case STATE.ITEM_ACTION:
                // _performItemAction で既に emotion='ITEM', action='アイテム名' がセットされているため上書き不要
                break;

            case STATE.GIFT_TIMEOUT:
                this.emotion = 'sad';
                this.action = 'gifttimeout';
                break;

            case STATE.USER_INTERACTING:
                this.emotion = 'happy';
                this.action = 'idle';
                break;
        }

        // 2.5 低好感度時は感情を sad に強制固定（アセット選択に反映させる）
        if (this.friendship <= -11 && this.emotion !== 'ITEM') {
            this.emotion = 'sad';
        }

        // 3. 状態からタイプ (mood / performance) を判定
        const performanceStates = [STATE.GIFT_REACTION, STATE.GIFT_TIMEOUT, STATE.ITEM_ACTION, STATE.USER_INTERACTING];
        const type = performanceStates.includes(newState) ? 'performance' : 'mood';

        // 3. ASSETS からフィルタリング (type, emotion, action)
        const candidates = Object.entries(ASSETS).filter(([key, data]) => {
            const parts = key.split('_'); // speaki_type_emotion_action_num
            if (parts.length < 4) return false;
            return parts[1] === type && parts[2] === this.emotion && parts[3] === this.action;
        });

        // 合致するものがなければ normal 感情で再検索
        let selectedEntry = null;
        if (candidates.length > 0) {
            selectedEntry = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            const fallbackCandidates = Object.entries(ASSETS).filter(([key, data]) => {
                const parts = key.split('_');
                return parts[1] === type && parts[2] === 'normal' && parts[3] === this.action;
            });
            if (fallbackCandidates.length > 0) {
                selectedEntry = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
            }
        }

        if (!selectedEntry) {
            this.currentAsset = null;
            this.motionType = 'none';
            return;
        }

        const [assetKey, assetData] = selectedEntry;
        this.currentAssetKey = assetKey;
        this.currentAsset = assetData;

        // 4. 音声の再生
        const game = window.game || Game.instance;
        if (assetData.soundfile && game) {
            this.currentVoice = game.playSound(assetData.soundfile);
        }

        // Performanceタイプなら音声長をDurationに反映
        const voice = this.currentVoice;
        if (type === 'performance' && voice) {
            const updateDuration = () => {
                if (isNaN(voice.duration) || voice.duration <= 0) return;
                this.actionDuration = voice.duration * 1000;
                console.log(`[Speaki] Dynamic performance duration: ${this.actionDuration}ms`);
            };

            if (voice.readyState >= 1) updateDuration();
            else voice.addEventListener('loadedmetadata', updateDuration, { once: true });
        }

        // 5. モーション設定
        this.motionType = assetData.movePattern || 'none';
        this.motionTimer = 0;
    }

    /** 現在の状態に応じた行動の実行 */
    _executeStateAction(dt) {
        const movementStates = [STATE.WALKING, STATE.GIFT_LEAVING, STATE.GIFT_RETURNING, STATE.ITEM_APPROACHING];
        const staticStates = [STATE.IDLE, STATE.GIFT_SEARCHING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.USER_INTERACTING, STATE.ITEM_ACTION];

        if (movementStates.includes(this.state)) {
            // 目的地が決まっていなければ初期化
            if (!this.destinationSet) {
                this._decideNextDestination();
            }
            // 移動を実行
            this._processMovement();
        }
        else if (staticStates.includes(this.state)) {
            // 到着直後（目的地設定が残っている）ならクリーンアップ
            if (this.destinationSet) {
                this._handleArrival();
            }
        }
    }

    /** DOMの表示更新（画像、位置、アニメーションなど） */
    syncSpeakiDOM() {
        const dom = this.dom;

        // 1. 画像切り替え (ASSETSから選択された画像を使用)
        if (this.currentAsset && this.currentAsset.imagefile) {
            const game = window.game || Game.instance;
            const img = game.images[this.currentAsset.imagefile];
            if (img && dom.sprite.src !== img.src) {
                dom.sprite.src = img.src;
            }
        }

        // 2. 位置とサイズ
        dom.container.style.width = `${this.size}px`;
        dom.container.style.height = `${this.size}px`;

        const bob = Math.sin(Date.now() / 200 + this.id * 100) * 5; // IDで位相をずらす
        dom.container.style.left = `${this.x - this.size / 2}px`;
        dom.container.style.top = `${this.y - this.size / 2 + bob}px`;

        const flip = this.facingLeft ? 1 : -1;
        const transform = `perspective(800px) rotateX(${this.distortion.rotateX}deg) skewX(${this.distortion.skewX}deg) scale(${this.distortion.scale}) scaleX(${flip})`;
        dom.sprite.style.transform = transform;

        // 3. 絵文字 (将来的にテキスト表示に統合)
        let emoji = '';
        if ([STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION, STATE.GIFT_REACTION].includes(this.state)) emoji = '🎁';
        else if (this.isDragging) emoji = '❤️';

        dom.emoji.textContent = emoji;

        // 4. セリフ（text）の表示
        dom.debugText.textContent = (this.currentAsset && this.currentAsset.text) || '';
    }

    /** ドラッグ時・モーションアニメーションの更新 */
    _updateDistortion(dt) {
        this.motionTimer += dt || 16;

        if (this.isActuallyDragging) {
            this.distortion.skewX += (this.targetDistortion.skewX - this.distortion.skewX) * 0.15;
            this.distortion.rotateX += (this.targetDistortion.rotateX - this.distortion.rotateX) * 0.15;
            this.distortion.scale += (this.targetDistortion.scale - this.distortion.scale) * 0.15;
            return;
        }

        // ASSETS定義に基づくモーション適用
        switch (this.motionType) {
            case 'shake':
                this.distortion.skewX = Math.sin(this.motionTimer * 0.05) * 10;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale = 1.0;
                break;
            case 'stretch':
                const stretch = Math.sin(this.motionTimer * 0.01) * 0.1;
                this.distortion.scale = 1.0 + stretch;
                this.distortion.rotateX = stretch * -50;
                this.distortion.skewX *= 0.85;
                break;
            case 'bounce':
                const bounce = Math.abs(Math.sin(this.motionTimer * 0.01)) * 0.1;
                this.distortion.scale = 1.0 + bounce;
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                break;
            default:
                this.distortion.skewX *= 0.85;
                this.distortion.rotateX *= 0.85;
                this.distortion.scale += (1.0 - this.distortion.scale) * 0.15;
                break;
        }
    }

    /** アイテムへの接近を開始する（共通化メソッド） */
    approachItem(item, offset = 100) {
        if (!item) return;

        this.state = STATE.ITEM_APPROACHING;
        this.targetItem = item;

        // アイテムから自分の方へ offset 離れた位置を目的地にする
        const dx = this.x - item.x;
        const dy = this.y - item.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.targetX = item.x + (dx / dist) * offset;
            this.targetY = item.y + (dy / dist) * offset;
        } else {
            // 完全に重なっている場合は右にずらす
            this.targetX = item.x + offset;
            this.targetY = item.y;
        }

        this.destinationSet = true;
        this._onStateChanged(this.state);
    }

    /** 目的地を決定（移動開始時の1回だけ実行） */
    _decideNextDestination() {
        const canvasWidth = this.parentElement.clientWidth || window.innerWidth;
        const canvasHeight = this.parentElement.clientHeight || window.innerHeight;

        // 宛先設定
        this.action = 'walking';
        this.destinationSet = true;
        this.currentImgSrc = ''; // 移動開始時に画像を再抽選

        // 目的地タイプに応じた座標設定
        switch (this.state) {
            case STATE.GIFT_LEAVING:
                this.targetX = -100;
                this.targetY = canvasHeight / 2;
                break;
            case STATE.GIFT_RETURNING:
                this.targetX = canvasWidth * 0.4 + (Math.random() * 100 - 50);
                this.targetY = canvasHeight * 0.5 + (Math.random() * 100 - 50);
                this._onStateChanged(this.state);
                break;
            case STATE.WALKING:
            default:
                // 好感度が「とっても低い」場合は隠れ場所周辺に移動
                if (this.friendship <= -31) {
                    this.targetItem = null;
                    this.targetX = 50 + (Math.random() * 40 - 20); // 50 ± 20
                    this.targetY = 100 + (Math.random() * 40 - 20); // 100 ± 20
                    this.destinationSet = true;
                    this._onStateChanged(this.state);
                    break;
                }

                // 20%の確率でアイテムを目的地にする
                const game = window.game || Game.instance;
                if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
                    const item = game.placedItems[Math.floor(Math.random() * game.placedItems.length)];
                    this.approachItem(item); // 共通メソッドを使用し、停止距離は100px
                } else {
                    this.targetItem = null;
                    this.targetX = Math.random() * (canvasWidth - 100) + 50;
                    this.targetY = Math.random() * (canvasHeight - 100) + 50;
                    // 通常の歩行（WALKING）のままであればactionは既にwalkingになっているはずだが、
                    // 万が一のために_onStateChangedを呼んでアセットを確定させる
                    this._onStateChanged(this.state);
                }
                break;
        }
    }

    /** 移動処理 */
    _processMovement() {
        // 目的地が設定されていなければ何もしない
        if (!this.destinationSet) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 目的地に十分近い（5px以内）場合は、到着処理を実行して終了
        if (dist <= 5) {
            this._handleArrival();
            return;
        }

        // 移動継続：角度を計算して座標を更新
        const angle = Math.atan2(dy, dx);

        // 逃走中（好感度が低く、隠れ家に向かっている）なら速度を2倍にする
        let currentSpeed = this.speed;
        const distToHiddenTarget = Math.sqrt(Math.pow(this.targetX - 50, 2) + Math.pow(this.targetY - 100, 2));
        if (this.friendship <= -31 && distToHiddenTarget < 30) {
            currentSpeed *= 2.0;
        }

        this.x += Math.cos(angle) * currentSpeed;
        this.y += Math.sin(angle) * currentSpeed;
        this.angle = angle;

        // 進んでいる方向（左右）を更新
        if (Math.abs(dx) > 1) {
            this.facingLeft = dx < 0;
        }
    }

    /** 目的地到着時の物理的なクリーンアップ */
    _handleArrival() {
        this.arrivalTime = Date.now();
        this.destinationSet = false;

        // 到着時（待機開始時）に画像を再抽選させる
        this.currentImgSrc = '';

        // 待機時間をある程度ランダムに決定 (2秒 ~ 8秒)
        this.waitDuration = 2000 + Math.random() * 6000;

        // 到着時の物理的なクリーンアップのみ行う
        // (状態遷移やイベント開始は _updateStateTransition で実行済み)
        if (this.state === STATE.WALKING) {
            this.action = 'idle';
        }
    }

    /** アイテムに到着した際の固有アクション */
    _performItemAction(item) {

        this.emotion = 'ITEM';
        this.action = item.id;

        // 時間を記録
        this.actionStartTime = Date.now();
        this.eventStartTime = this.actionStartTime;
        this.targetItem = null;

        // 音声と画像アセットの切り替えは、この後の _onStateChanged(STATE.ITEM_ACTION) が行う
    }

    /** インタラクション終了時の処理（3秒間喜んでから元の行動に戻る） */
    _processFinishInteraction() {
        this.action = 'happy';

        // 3秒間その場で喜ぶモーションを維持する
        setTimeout(() => {
            // 待機中に別のドラッグやイベントが発生して状態が変わっていたら何もしない
            if (this.state !== STATE.USER_INTERACTING) return;

            this.action = 'idle';

            // 好感度が非常に低い場合、インタラクション終了後にすぐに隠れるように
            if (this.friendship <= -31) {
                this.state = STATE.IDLE;
                this._onStateChanged(this.state);
                return;
            }

            // 中断されていた行動（お土産イベント中など）があればそこに戻り、なければ待機へ
            if (this.stateStack && this.stateStack.length > 0) {
                this.state = this.stateStack.pop();
            } else {
                this.state = STATE.IDLE;
            }
            this._onStateChanged(this.state);
        }, 3000);
    }

    /** 好感度のラベル取得 (5段階) */
    getFriendshipLabel() {
        if (this.friendship >= 31) return 'とっても高い';
        if (this.friendship >= 11) return '高い';
        if (this.friendship >= -10) return 'どちらでもない';
        if (this.friendship >= -30) return '低い';
        return 'とっても低い';
    }

    /** 好感度のCSSクラス取得 */
    getFriendshipClass() {
        if (this.friendship >= 31) return 'friendship-v-high';
        if (this.friendship >= 11) return 'friendship-high';
        if (this.friendship >= -10) return 'friendship-normal';
        if (this.friendship >= -30) return 'friendship-low';
        return 'friendship-v-low';
    }

    /** UI表示用のステータス名取得 */
    getStateLabel() {
        if (this.friendship <= -31 && [STATE.IDLE, STATE.WALKING].includes(this.state)) {
            return 'かくれてる';
        }
        switch (this.state) {
            case STATE.IDLE: return '休憩中';
            case STATE.WALKING: return 'お散歩中';
            case STATE.GIFT_LEAVING:
            case STATE.GIFT_SEARCHING:
            case STATE.GIFT_RETURNING: return 'お土産探し中';
            case STATE.GIFT_WAIT_FOR_USER_REACTION: return '待機中';
            case STATE.ITEM_APPROACHING: return 'アイテムへ移動中';
            case STATE.ITEM_ACTION: return 'アイテムで遊んでる';
            case STATE.USER_INTERACTING: return 'ふれあい中';
            default: return 'のんびり';
        }
    }
}

class Game {
    /** コンストラクタ: ゲームの初期化 */
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.speakiRoom = document.getElementById('speaki-room');

        this.speakis = [];      // 複数管理用の配列
        this.furniture = [];
        this.placedItems = [];
        this.lastGiftTime = Date.now();

        this.images = {};      // キャッシュ用（パス -> Image）
        this.sounds = {};      // キャッシュ用（ファイル名 -> Audio）

        // 音声管理
        this.audioEnabled = false;

        Game.instance = this;

        this.loadResources();

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;

        // 開始ボタンの待機
        const startBtn = document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    /** アセット（画像・音声）の全読み込み */
    loadResources() {
        Object.entries(ASSETS).forEach(([key, data]) => {
            // 1. 画像のロード
            if (data.imagefile && !this.images[data.imagefile]) {
                const img = new Image();
                img.src = `speaki_images/${data.imagefile}`;
                this.images[data.imagefile] = img;
                // 後方互換性のためパス形式でも登録
                this.images[`speaki_images/${data.imagefile}`] = img;
            }

            // 2. 音声のロード（Audioオブジェクトを事前に作成）
            if (data.soundfile && !this.sounds[data.soundfile]) {
                const audio = new Audio(`speaki_sounds/${data.soundfile}`);
                this.sounds[data.soundfile] = audio;
            }
        });

        // ITEMSに定義された画像をすべて読み込む
        Object.values(ITEMS).forEach(item => {
            if (item.imagefile) {
                const path = `speaki_images/${item.imagefile}`;
                const img = new Image();
                img.src = path;
                const key = item.imagefile.replace('.png', '');
                this.images[key] = img;
                this.images[path] = img; // パス指定でも引けるように
            }
        });

        // 特別なリソース（旧仕様との互換性や特定の演出用）
        const specialAssets = ['item_baby_speaki.png', 'item_pumpkin.png'];
        specialAssets.forEach(fileName => {
            if (!this.images[fileName.replace('.png', '')]) {
                const path = `speaki_images/${fileName}`;
                const img = new Image();
                img.src = path;
                this.images[fileName.replace('.png', '')] = img;
            }
        });
    }

    /** 音声の再生（インスタンスを返す） */
    playSound(fileName) {
        if (!this.audioEnabled || !this.sounds[fileName]) return null;

        const audio = this.sounds[fileName];
        const playClone = audio.cloneNode();
        playClone.play().catch(e => console.log("[Audio] Playback failed:", e));
        return playClone;
    }

    /** ゲームの初期設定 */
    init() {
        this.initItemMenu();
        this.setupInteractions();
        this.setupDragAndDrop();

        // 初期Speaki生成は startGame で行うためここでは削除
    }

    /** タイトル画面を閉じてゲームを開始する */
    startGame() {
        const titleScreen = document.getElementById('title-screen');
        if (titleScreen) {
            titleScreen.classList.add('fade-out');
        }

        // ユーザーアクションをきっかけに音声を有効化
        this.audioEnabled = true;

        // 初期Speaki生成（1匹）
        // アセットのロード完了を待つ必要はない（画像は描画時に解決される）
        this.addSpeaki();
    }

    /** アイテムメニューを動的に生成 */
    initItemMenu() {
        const itemList = document.getElementById('item-list');
        if (!itemList) return;

        itemList.innerHTML = ''; // クリア

        Object.entries(ITEMS).forEach(([id, config]) => {
            if (config.showInMenu) {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'draggable-item';
                itemDiv.dataset.id = id;
                itemDiv.dataset.type = config.type || 'item';
                itemDiv.draggable = true;
                itemDiv.textContent = config.name || id;
                itemList.appendChild(itemDiv);
            }
        });
    }

    /** 新しいSpeakiを追加 */
    addSpeaki(x, y) {
        const id = this.speakis.length;
        const finalX = x !== undefined ? x : window.innerWidth * 0.4 + (Math.random() * 100 - 50);
        const finalY = y !== undefined ? y : window.innerHeight * 0.5 + (Math.random() * 100 - 50);
        const speaki = new Speaki(id, this.speakiRoom, finalX, finalY);
        this.speakis.push(speaki);
    }

    /** キャンバスのサイズ調整 */
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    /** インタラクション（マウスイベント等）の設定 */
    setupInteractions() {
        // 初回クリック時に音声を有効化
        const unlockAudio = () => {
            if (!this.audioEnabled) {
                this.audioEnabled = true;
                console.log("[Audio] System unlocked by user interaction.");
                // 沈黙を流してコンテキストを活性化（iOS/Safari対策）
                const silent = new Audio();
                silent.play().catch(() => { });
            }
            window.removeEventListener('mousedown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('mousedown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

        document.getElementById('gift-btn-receive').onclick = () => this.receiveGift();
        document.getElementById('reaction-btn-1').onclick = () => this.handleReaction(1);
        document.getElementById('reaction-btn-2').onclick = () => this.handleReaction(2);
    }

    /** ドラッグ＆ドロップの設定 */
    setupDragAndDrop() {
        const draggables = document.querySelectorAll('.draggable-item');
        draggables.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    id: item.dataset.id,
                    type: item.dataset.type
                }));
            });
        });

        this.canvas.addEventListener('dragover', (e) => e.preventDefault());
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.addItem(data.id, data.type, x, y);
        });
    }

    /** アイテムの配置 */
    addItem(id, type, x, y) {
        const itemDef = ITEMS[id];
        if (!itemDef) return;

        const item = {
            id,
            type: itemDef.type || type,
            x,
            y,
            size: itemDef.size || (type === 'furniture' ? 100 : 40),
            placedTime: Date.now(),
            stage: 'default',
            displayText: itemDef.text || null,
            textDisplayUntil: itemDef.text ? Date.now() + 3000 : 0
        };

        this.placedItems.push(item);

        // 配置時の音声再生
        if (itemDef.soundfile) {
            this.playSound(itemDef.soundfile);
        }

        // 配置直後にスピキたちが興味を持つ（ignoreReactionが設定されていない場合）
        if (!itemDef.ignoreReaction) {
            this.speakis.forEach(speaki => {

                // 半径500px以内のスピキだけが反応する
                let distToItem = Math.sqrt((speaki.x - x) ** 2 + (speaki.y - y) ** 2);
                if (distToItem > 500) return;

                // 好感度が「とっても低い」場合はアイテムに興味を示さない
                if (speaki.friendship <= -31) return;

                const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION].includes(speaki.state);
                const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.state);

                // 割り込み可能な状態ならスタックに保存
                if (isGiftEventActive || isItemEventActive) {
                    speaki.stateStack.push(speaki.state);
                }

                // アイテムへの接近を開始（共通メソッドを使用、距離は50px）
                speaki.friendship = Math.min(50, speaki.friendship + 2);
                speaki.approachItem(item, 50);
            });
        }
    }

    /** マウスダウン処理（Speakiのドラッグ開始） */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 1. ヒットテスト: クリック位置のスピキを取得（手前のものを優先）
        const target = this._findSpeakiAt(mouseX, mouseY);
        if (!target) return;

        // 2. インタラクト許可判定: 指定した状態のときのみ操作を受け付ける
        const interactableStates = [
            STATE.IDLE,
            STATE.WALKING,
            STATE.GIFT_RETURNING,
            STATE.GIFT_LEAVING,
            STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING,
        ];

        if (!interactableStates.includes(target.state)) {
            console.log(`[Interaction] Blocked in state: ${target.state}`);
            return;
        }

        // 3. ドラッグ・操作の開始
        this._startInteracting(target, mouseX, mouseY);
    }

    /** 指定座標にあるスピキを検索（手前の個体を優先） */
    _findSpeakiAt(x, y) {
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const s = this.speakis[i];
            const dist = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);

            // 基本的な当たり判定（円形）かつ、画像の上部(頭部らへん）であること
            const isHeadHit = (y < s.y - s.size / 5); //5がちょうどよさそう

            if (dist < s.size / 2 && isHeadHit) return s;
        }
        return null;
    }

    /** ユーザーによる操作（ドラッグ）の開始 */
    _startInteracting(speaki, x, y) {
        speaki.isDragging = true;
        speaki.dragStartTime = Date.now();
        speaki.lastMouseX = x;
        speaki.lastMouseY = y;

        // 割り込み判定：保存すべき状態のリスト
        const interruptibleStates = [
            STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING,
            STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION,
            STATE.ITEM_APPROACHING, STATE.ITEM_ACTION
        ];

        if (interruptibleStates.includes(speaki.state)) {
            speaki.stateStack.push(speaki.state);
        }

        speaki.state = STATE.USER_INTERACTING;
        this.draggingSpeaki = speaki;
        speaki._onStateChanged(speaki.state);
    }

    /** マウスムーブ処理（なでなで演出） */
    handleMouseMove(e) {
        if (!this.draggingSpeaki) return;

        const speaki = this.draggingSpeaki;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - speaki.lastMouseX;
        const dy = mouseY - speaki.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 5) return;

        // なでなで判定
        if (speaki.state === STATE.USER_INTERACTING) {
            speaki.pettingStartTime = Date.now();
            speaki.isActuallyDragging = true;

            // 好感度を微増 (最高50)
            speaki.friendship = Math.min(50, speaki.friendship + 0.05);

            // 好感度が高い時は、なでなでされると必ずハッピーになる
            if (speaki.friendship >= 11) {
                speaki.emotion = 'happy';
            }

            // なでなで中はサウンドをループ再生させる
            if (speaki.currentVoice) {
                speaki.currentVoice.loop = true;
            }
        }

        speaki.isActuallyDragging = true;

        // なでなで演出：位置は変えず、喜びの表情と震えのみ適用
        speaki.action = 'happy';
        speaki.emotion = 'happy';

        // マウスの動きに合わせた歪み（震え）の演出
        speaki.targetDistortion.skewX = Math.max(-20, Math.min(20, dx * -1.0));
        speaki.targetDistortion.rotateX = Math.max(-15, Math.min(15, dy * -0.5));
        speaki.targetDistortion.scale = 1.05;

        speaki.lastMouseX = mouseX;
        speaki.lastMouseY = mouseY;
    }

    /** マウスアップ処理（ドラッグ終了 / クリック終了） */
    handleMouseUp() {
        // 対象がいなければ即座に終了
        if (!this.draggingSpeaki) return;

        const speaki = this.draggingSpeaki;
        const isTap = (Date.now() - speaki.dragStartTime < 300) && !speaki.isActuallyDragging;

        // 1. たたかれた（タップ）時の固有処理
        if (isTap) {
            speaki.action = 'surprised';
            speaki.emotion = 'sad';

            // 好感度を大幅に減らす (最低-50)
            speaki.friendship = Math.max(-50, speaki.friendship - 5);

            this.playSound('surprised');
        }

        // 2. 表情リセットタイマーの開始（タップまたはドラッグ終了時）
        if (isTap || speaki.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        // 3. 物理的な状態のクリーンアップ
        speaki.isDragging = false;
        speaki.isActuallyDragging = false;
        speaki.arrivalTime = Date.now();
        speaki.destinationSet = false;

        // 4. 次の状態へ復帰（スタックから復帰、なければIDLEへ）
        if (speaki.stateStack.length > 0) {
            speaki.state = speaki.stateStack.pop();
        } else {
            speaki.state = STATE.IDLE;
        }

        // なでなでループ音声を停止
        if (speaki.currentVoice) {
            speaki.currentVoice.loop = false;
            speaki.currentVoice.pause();
            speaki.currentVoice = null;
        }

        this.draggingSpeaki = null;
    }

    /** アクションタイマーをリセットして新しく予約するヘルパー */
    _resetActionTimer(speaki, delay) {
        if (speaki.actionTimeout) {
            clearTimeout(speaki.actionTimeout);
        }
        speaki.actionTimeout = setTimeout(() => this.resetSpeakiAppearance(speaki), delay);
    }

    /** Speakiの見た目をリセット */
    resetSpeakiAppearance(speaki) {
        if (!speaki) return;

        // タイマー参照をクリア
        speaki.actionTimeout = null;

        if (speaki.state === STATE.GIFT_RETURNING || speaki.state === STATE.GIFT_READY) {
            speaki.action = 'idle';
        } else {
            speaki.action = 'idle';
        }

        // アクション終了時に音声を停止
        if (speaki.currentVoice) {
            speaki.currentVoice.loop = false;
            speaki.currentVoice.pause();
            speaki.currentVoice = null;
        }

        // 好感度に応じて表情をリセット
        speaki.emotion = (speaki.friendship <= -11) ? 'sad' : 'happy';
    }

    /** ギフトイベントのUI表示を更新する */
    updateGiftUI(mode) {
        const ui = document.getElementById('gift-event-ui');
        const receiveBtn = document.getElementById('gift-btn-receive');
        const reactionGroup = document.getElementById('reaction-group');
        const message = document.getElementById('gift-message');

        switch (mode) {
            case 'start':
                message.textContent = 'お土産を持ってきたよ！';
                ui.classList.remove('hidden');
                receiveBtn.classList.remove('hidden');
                reactionGroup.classList.add('hidden');
                break;
            case 'receiving':
                message.textContent = '何をくれるかな？';
                receiveBtn.classList.add('hidden');
                reactionGroup.classList.remove('hidden');
                break;
            case 'hide':
                ui.classList.add('hidden');
                break;
        }
    }

    /** ギフト受け取りイベントの開始 */
    startGiftReceiveEvent(speaki) {
        this.giftPartner = speaki;
        speaki.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
        speaki.eventStartTime = Date.now();
        speaki._onStateChanged(speaki.state);

        this.updateGiftUI('start');
        this.playSound('gift');
    }

    /** ギフトを受け取る処理 */
    receiveGift() {
        if (this.giftTimeout) clearTimeout(this.giftTimeout);
        this.updateGiftUI('receiving');
    }

    /** リアクション処理 */
    handleReaction(type) {
        this.updateGiftUI('hide');

        if (this.giftPartner) {
            this.giftPartner.state = STATE.GIFT_REACTION;
            this.giftPartner.eventStartTime = Date.now();
            this.giftPartner._onStateChanged(this.giftPartner.state);
            this.playSound('happy');
        }
    }

    /** ギフトイベントの完了 */
    completeGiftEvent() {
        if (this.giftPartner) {
            this.giftPartner.state = STATE.IDLE;
            this.resetSpeakiAppearance(this.giftPartner);
        }
        this.giftPartner = null;
        this.lastGiftTime = Date.now();
    }

    /** ゲームループ */
    loop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    /** ゲーム全体の更新 */
    update(dt) {
        // 全Speaki更新
        this.speakis.forEach(speaki => speaki.update(dt));

        // アイテムのライフサイクル更新 (かぼちゃ -> 赤ちゃん -> 大人)
        this._updateItemLifecycles();

        this.updateSpeakiListUI();
    }

    /** アイテムの成長・変化を管理 */
    _updateItemLifecycles() {
        const now = Date.now();
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const itemDef = ITEMS[item.id];
            if (!itemDef || !itemDef.transform) continue;

            const age = now - item.placedTime;
            const transform = itemDef.transform;

            if (age > transform.duration) {
                if (transform.isAdult) {
                    // スピキとして群れに加わる
                    this.addSpeaki(item.x, item.y);
                    this.placedItems.splice(i, 1);
                } else if (transform.nextId) {
                    // 別のアイテムに変化
                    const nextId = transform.nextId;
                    const nextDef = ITEMS[nextId];
                    if (nextDef) {
                        item.id = nextId;
                        item.size = nextDef.size || item.size;
                        item.placedTime = now; // 次の変化へのタイマーリセット

                        // 変化後のアイテムの演出（音声・テキスト）を適用
                        if (nextDef.soundfile) this.playSound(nextDef.soundfile);
                        if (nextDef.text) {
                            item.displayText = nextDef.text;
                            item.textDisplayUntil = now + 3000;
                        }
                    }
                }
            }
        }
    }

    /** 全スピキの状態リストUIを更新 */
    updateSpeakiListUI() {
        const listContainer = document.getElementById('speaki-list');
        if (!listContainer) return;

        if (this.speakis.length === 0) {
            listContainer.innerHTML = '<p class="empty-list">スピキはいません</p>';
            return;
        }

        let html = '';
        this.speakis.forEach(s => {
            const label = s.getFriendshipLabel();
            const cls = s.getFriendshipClass();
            const state = s.getStateLabel();

            // 感情の表示名
            let emotionLabel = '穏やか';
            if (s.state === STATE.USER_INTERACTING) {
                if (s.emotion === 'sad') emotionLabel = 'いたい...';
                else if (s.friendship >= 11) emotionLabel = 'うれしい！';
                else emotionLabel = 'なでなで';
            } else if (s.emotion === 'ITEM') emotionLabel = 'ワクワク';
            else if (s.emotion === 'happy') emotionLabel = 'しあわせ';
            else if (s.emotion === 'sad') emotionLabel = 'かなしい';

            html += `
                <div class="speaki-entry">
                    <div class="speaki-entry-header">
                        <span class="speaki-name">スピキ #${s.id + 1}</span>
                        <span class="speaki-friendship ${cls}">${label}</span>
                    </div>
                    <div class="speaki-detail">
                        <div class="speaki-detail-item">
                            <span>状態:</span>
                            <span class="speaki-detail-val">${state}</span>
                        </div>
                        <div class="speaki-detail-item">
                            <span>感情:</span>
                            <span class="speaki-detail-val">${emotionLabel}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;

        // ギフトカウントダウンの更新
        const countdownEl = document.getElementById('gift-countdown');
        if (countdownEl) {
            const timeSinceGift = Date.now() - this.lastGiftTime;
            const remaining = Math.max(0, Math.ceil((30000 - timeSinceGift) / 1000));
            // パートナーがいる場合は「発生中」
            countdownEl.textContent = this.giftPartner ? '発生中' : (remaining > 0 ? `${remaining}s` : 'Ready!');
        }
    }

    /** 描画処理 */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // アイテムの描画
        this.placedItems.forEach(item => {
            const itemDef = ITEMS[item.id];
            if (!itemDef) return;

            const imgKey = itemDef.imagefile ? itemDef.imagefile.replace('.png', '') : '';
            if (this.images[imgKey]) {
                const img = this.images[imgKey];
                this.ctx.drawImage(img, item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
            }

            // アイテムのテキスト表示
            if (item.displayText && Date.now() < item.textDisplayUntil) {
                this.ctx.save();
                this.ctx.font = "bold 18px 'Zen Maru Gothic', sans-serif";
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.lineWidth = 3;

                const textY = item.y - item.size / 2 - 10;
                this.ctx.strokeText(item.displayText, item.x, textY);
                this.ctx.fillText(item.displayText, item.x, textY);
                this.ctx.restore();
            }
        });
    }
}


window.onload = () => {
    window.game = new Game();
};

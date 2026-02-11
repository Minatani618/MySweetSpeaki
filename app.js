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
        this.currentAssetKey = ''; // 現在の「感情_行動」
        this.currentImgSrc = '';   // 現在選択されている画像パス
        this.targetItem = null;    // 現在向かっているアイテム同期用

        // DOM生成
        this.createDOM();

        // 初期画像を表示
        this.syncSpeakiDOM();
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

        container.appendChild(img);
        container.appendChild(emoji);
        this.parentElement.appendChild(container); // 親要素に追加

        this.dom.container = container;
        this.dom.sprite = img;
        this.dom.emoji = emoji;
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
    }

    /** 状態の切り替え判定（判断のみ） */
    _updateStateTransition() {
        const now = Date.now();
        const dist = this.destinationSet ? Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2)) : 999;
        const arrived = dist <= 100; // ある程度近づいたら到着とみなす（小さくすると複数のスピキが完全に重なってしまうため）

        switch (this.state) {
            case STATE.IDLE:
                // お土産イベントのトリガーチェック（メイン個体のみ）
                if (this.id === 0) {
                    const timeSinceGift = now - window.game.lastGiftTime;
                    if (timeSinceGift >= 30000) {
                        this.state = STATE.GIFT_LEAVING;
                        return;
                    }
                }

                // 通常の待機終了チェック
                const elaspedTime = now - this.arrivalTime; // 経過時間
                if (elaspedTime > this.waitDuration) {
                    this.state = STATE.WALKING;
                }
                break;

            case STATE.WALKING:
                if (arrived) this.state = STATE.IDLE;
                break;

            case STATE.GIFT_LEAVING:
                if (arrived) this.state = STATE.GIFT_SEARCHING;
                break;

            case STATE.GIFT_SEARCHING:
                if (now - this.arrivalTime > 5000) { // 5秒待機で戻る
                    this.state = STATE.GIFT_RETURNING;
                }
                break;

            case STATE.GIFT_RETURNING:
                if (arrived) {
                    this.state = STATE.GIFT_WAIT_FOR_USER_REACTION;
                    window.game.startGiftReceiveEvent(this);
                    this.eventStartTime = now; // イベント開始時刻を記録
                }
                break;

            case STATE.GIFT_WAIT_FOR_USER_REACTION:
                // 10秒間反応がなければタイムアウト（寝てしまう）
                if (now - this.eventStartTime > 10000) {
                    this.state = STATE.GIFT_TIMEOUT;
                    this.eventStartTime = now;
                    this.action = 'sleeping';
                    window.game.updateGiftUI('hide');
                    const emotionEl = document.getElementById('status-emotion');
                    if (emotionEl) emotionEl.textContent = 'ぐーぐー...';
                }
                break;

            case STATE.GIFT_REACTION:
                // 3秒間喜んでから終了
                if (now - this.eventStartTime > 3000) {
                    window.game.completeGiftEvent();
                }
                break;

            case STATE.GIFT_TIMEOUT:
                // 5秒間寝てから終了
                if (now - this.eventStartTime > 5000) {
                    window.game.completeGiftEvent();
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
                }
                break;

            case STATE.ITEM_ACTION:
                // アイテムアクション終了を時間ベースで判定
                const itemActionElapsed = now - this.actionStartTime;
                if (itemActionElapsed > this.actionDuration) {
                    this.state = STATE.IDLE;
                    this.action = 'idle';
                    this.emotion = 'happy';
                }
                break;
        }
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

        // 1. 画像切り替え
        // 感情とアクションからキーを作成 (例: speaki_happy_wait)
        // 今回のアセットは _wait 系統がメインなので、アクションを wait に寄せているが
        // 将来的に _walking などが増えても対応できる設計にする。
        let mappedAction = this.action;
        if (mappedAction === 'idle' || mappedAction === 'walking') mappedAction = 'wait';

        const assetKey = `speaki_${this.emotion}_${mappedAction}`;

        // キーが変わったか、まだ画像が決まっていないなら再抽選
        if (this.currentAssetKey !== assetKey || !this.currentImgSrc) {
            this.currentAssetKey = assetKey;
            const game = window.game || Game.instance;
            if (game) {
                this.currentImgSrc = game.getRandomAsset(assetKey);
                // console.log(`[Speaki] Asset changed: ${assetKey} -> ${this.currentImgSrc}`);
            }
        }

        if (this.currentImgSrc && dom.sprite.src.indexOf(this.currentImgSrc) === -1) {
            dom.sprite.src = this.currentImgSrc;
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

        // 3. 絵文字
        let emoji = '';
        if (this.state === STATE.GIFT_RETURNING || this.state === STATE.GIFT_READY) emoji = '🎁';
        else if (this.isDragging) emoji = '❤️';

        dom.emoji.textContent = emoji;
    }

    /** ドラッグ時の歪み・インタラクションアニメーションの更新 */
    _updateDistortion(dt) {
        if (this.isActuallyDragging) {
            this.distortion.skewX += (this.targetDistortion.skewX - this.distortion.skewX) * 0.15;
            this.distortion.rotateX += (this.targetDistortion.rotateX - this.distortion.rotateX) * 0.15;
            this.distortion.scale += (this.targetDistortion.scale - this.distortion.scale) * 0.15;
        } else {
            this.distortion.skewX *= 0.85;
        }
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
                break;
            case STATE.WANDERING:
            default:
                // 20%の確率でアイテムを目的地にする
                const game = window.game || Game.instance;
                if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
                    const item = game.placedItems[Math.floor(Math.random() * game.placedItems.length)];
                    this.targetItem = item;
                    this.targetX = item.x;
                    this.targetY = item.y;
                } else {
                    this.targetItem = null;
                    this.targetX = Math.random() * (canvasWidth - 100) + 50;
                    this.targetY = Math.random() * (canvasHeight - 100) + 50;
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
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
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
        // 状態は既に ITEM_INTERACTING になっている

        if (item.id === 'baby-speaki') {
            this.action = 'happy';
            this.emotion = 'happy';
        } else if (item.id === 'cat-tower') {
            this.action = 'sleeping';
        } else if (item.id === 'toy-ball' || item.id === 'pumpkin') {
            this.action = 'surprised';
        } else {
            this.action = 'happy';
        }

        // 時間を記録（setTimeoutを削除）
        this.actionStartTime = Date.now();
        this.eventStartTime = this.actionStartTime;
        this.actionDuration = 3000 + Math.random() * 3000;
        this.targetItem = null;

        // 音声再生
        const game = window.game || Game.instance;
        if (game) {
            const soundCategory = (this.action === 'sleeping') ? 'sleep' : 'happy';
            game.playSound(soundCategory);
        }
    }

    /** インタラクション終了時の処理（3秒間喜んでから元の行動に戻る） */
    _processFinishInteraction() {
        this.action = 'happy';

        // 3秒間その場で喜ぶモーションを維持する
        setTimeout(() => {
            // 待機中に別のドラッグやイベントが発生して状態が変わっていたら何もしない
            if (this.state !== STATE.INTERACTING) return;

            this.action = 'idle';

            // 中断されていた行動（お土産イベント中など）があればそこに戻り、なければ待機へ
            if (this.interruptedState) {
                this.state = this.interruptedState;
                this.interruptedState = null;
            } else {
                this.state = STATE.IDLE;
            }
        }, 3000);
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

        this.images = {};      // キャッシュ用
        this.assetGroups = {}; // speaki_happy_wait: [path1, path2, ...]

        // 音声管理
        this.audioEnabled = false;
        this.sounds = {};      // カテゴリごとのAudioオブジェクト配列
        this.soundList = [
            'happy_1.mp3', 'happy_2.mp3',
            'surprised_1.mp3', 'surprised_2.mp3',
            'hatch_1.mp3',
            'gift_1.mp3',
            'sleep_1.mp3'
        ];

        Game.instance = this;

        // アセットの全ファイル名リスト
        // ほんとはfsなどで自動取得したいが、ブラウザ環境のためリスト化
        this.assetList = [
            'speaki_happy_wait_1.png',
            'speaki_happy_wait_2.png',
            'speaki_happy_wait_3.png',
            'speaki_normal_wait_1.png',
            'speaki_normal_wait_2.png',
            'speaki_sad_wait_1.png',
            'speaki_sad_wait_2.png',
            'speaki_sad_wait_3.png',
            'speaki_sad_surprised_1.png',
            'speaki_sad_surprised_2.png',
            'speaki_sad_surprised_3.png',
            'furniture_cat_tower.png',
            'item_toy_ball.png',
            'item_pumpkin.png',
            'item_baby_speaki.png'
        ];

        this.loadAssets();
        this.loadSounds();

        this.init();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;
        requestAnimationFrame((t) => this.loop(t));
    }

    /** アセット（画像）の読み込みとグループ化 */
    loadAssets() {
        this.assetList.forEach(fileName => {
            const path = `speaki_images/${fileName}`;
            const baseName = fileName.replace('.png', '');

            // 1. キャッシュに登録
            const img = new Image();
            img.src = path;
            this.images[path] = img;
            this.images[baseName] = img;

            // 2. Speaki用アセットのグループ化判定
            if (!fileName.startsWith('speaki_')) return;

            const parts = fileName.split('_');
            if (parts.length < 3) return;

            // グループキーの作成 (例: speaki_happy_wait)
            const groupKey = `${parts[0]}_${parts[1]}_${parts[2]}`;

            if (!this.assetGroups[groupKey]) {
                this.assetGroups[groupKey] = [];
            }
            this.assetGroups[groupKey].push(path); //二次元配列として画像をグループごとに登録
        });
    }

    getRandomAsset(groupKey) {
        const group = this.assetGroups[groupKey];
        if (!group) {
            return this.assetGroups['speaki_normal_wait']?.[0] || '';
        }
        return group[Math.floor(Math.random() * group.length)];
    }


    /** 音声の読み込み */
    loadSounds() {
        this.soundList.forEach(fileName => {
            const category = fileName.split('_')[0]; // 'happy', 'surprised' など
            const path = `speaki_sounds/${fileName}`;

            if (!this.sounds[category]) this.sounds[category] = [];

            const audio = new Audio(path);
            this.sounds[category].push(audio);
        });
    }

    /** 音声の再生（カテゴリからランダムに選択） */
    playSound(category) {
        if (!this.audioEnabled || !this.sounds[category]) return;

        const group = this.sounds[category];
        const audio = group[Math.floor(Math.random() * group.length)];

        // 連続再生のためにクローンするか、最初から再生する
        const playClone = audio.cloneNode();
        playClone.play().catch(e => console.log("[Audio] Playback failed:", e));
    }

    /** ゲームの初期設定 */
    init() {
        this.setupInteractions();
        this.setupDragAndDrop();

        // 初期Speaki生成（3匹）
        // アセットのロード完了を待つ必要はない（画像は描画時に解決される）が
        // 念のため少しだけ遅らせて生成してもよい。今回は即時生成。
        for (let i = 0; i < 3; i++) {
            this.addSpeaki();
        }
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
        const item = {
            id,
            type,
            x,
            y,
            size: type === 'furniture' ? 100 : 40,
            placedTime: Date.now(),
            stage: 'default'
        };

        // かぼちゃの場合の初期サイズ調整
        if (id === 'pumpkin') item.size = 60;
        if (id === 'baby-speaki') item.size = 80;

        this.placedItems.push(item);

        // 配置直後は全員興味を持つ
        this.speakis.forEach(speaki => {
            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING, STATE.GIFT_WAIT_FOR_USER_REACTION].includes(speaki.state);
            const isItemEventActive = [STATE.ITEM_APPROACHING, STATE.ITEM_ACTION].includes(speaki.state);

            // 割り込み可能な状態ならスタックに保存
            if (isGiftEventActive || isItemEventActive) {
                speaki.stateStack.push(speaki.state);
            }

            speaki.state = STATE.ITEM_APPROACHING;  // INTERACTING から変更
            speaki.targetX = x;
            speaki.targetY = y;
            speaki.targetItem = { id, x, y };  // アイテム情報を保存
            speaki.destinationSet = true;
            speaki.action = 'happy';
        });

        // 配置時の音声再生
        this.playSound('happy');
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

            // 基本的な当たり判定（円形）かつ、画像の上部1/4以内（頭部）であること
            const isHeadHit = (y < s.y - s.size / 4);

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
    }

    /** マウスムーブ処理（ドラッグ中の移動） */
    handleMouseMove(e) {
        if (!this.draggingSpeaki) return;

        const speaki = this.draggingSpeaki;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - speaki.lastMouseX;
        const dy = mouseY - speaki.lastMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= 10) return;

        speaki.action = 'happy';
        speaki.emotion = 'happy';
        speaki.isActuallyDragging = true;

        // 1匹だけドラッグしていても全体UIが「うれしい！」になるのは許容
        document.getElementById('status-emotion').textContent = 'うれしい！';

        speaki.lastMouseX = mouseX;
        speaki.lastMouseY = mouseY;

        speaki.targetDistortion.skewX = Math.max(-20, Math.min(20, dx * -1.0));
        speaki.targetDistortion.rotateX = Math.max(-15, Math.min(15, dy * -0.5));
        speaki.targetDistortion.scale = 0.98;
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
            document.getElementById('status-emotion').textContent = 'いたい...';
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
        speaki.emotion = 'happy';
        document.getElementById('status-emotion').textContent = '穏やか';
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
        speaki.action = 'happy';

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
            this.giftPartner.action = 'happy';
            const emotionEl = document.getElementById('status-emotion');
            if (emotionEl) emotionEl.textContent = (type === 1) ? 'えへへ、うれしい！' : 'どういたしまして！';
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

        this._updateUIStatus();
    }

    /** アイテムの成長・変化を管理 */
    _updateItemLifecycles() {
        const now = Date.now();
        for (let i = this.placedItems.length - 1; i >= 0; i--) {
            const item = this.placedItems[i];
            const age = now - item.placedTime;

            if (item.id === 'pumpkin' && age > 10000) {
                // 10秒で赤ちゃんに孵化
                item.id = 'baby-speaki';
                item.size = 80;
                item.placedTime = now; // 次の成長へのタイマーリセット
                this.playSound('hatch');
                console.log("[Game] Pumpkin hatched into Baby Speaki!");
            } else if (item.id === 'baby-speaki' && age > 20000) {
                // さらに20秒で大人に成長
                this.addSpeaki(item.x, item.y);
                this.placedItems.splice(i, 1);
                console.log("[Game] Baby Speaki grew up and joined the group!");
            }
        }
    }

    /** UIステータスの更新 */
    _updateUIStatus() {
        // 代表して最初の個体の状態を表示する（簡易実装）
        if (this.speakis.length > 0) {
            const s = this.speakis[0];
            const emEl = document.getElementById('status-emotion');
            const acEl = document.getElementById('status-action');
            if (emEl) emEl.textContent = s.emotion === 'happy' ? '幸せ' : (s.emotion === 'sad' ? '悲しい' : '穏やか');
            if (acEl) acEl.textContent = s.action === 'walking' ? '散歩中' : (s.action === 'idle' ? '待機中' : '活動中');

            // お土産カウントダウンの更新
            const timeSinceGift = Date.now() - this.lastGiftTime;
            const countdown = Math.ceil((30000 - timeSinceGift) / 1000);
            let statusText = '準備中...';
            if ([STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING, STATE.GIFT_READY].includes(s.state)) {
                statusText = '発生中...';
            } else if (countdown > 0) {
                statusText = `${countdown}秒`;
            }
            const cdEl = document.getElementById('gift-countdown');
            if (cdEl) cdEl.textContent = statusText;

            // Debug Stateの更新 (id===0の個体の状態を表示)
            const debugEl = document.getElementById('status-debug-state');
            if (debugEl) debugEl.textContent = s.state;
        }
    }

    /** 描画処理 */
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.placedItems.forEach(item => {
            let imgKey = '';
            if (item.id === 'cat-tower') imgKey = 'furniture_cat_tower';
            else if (item.id === 'toy-ball') imgKey = 'item_toy_ball';
            else if (item.id === 'luxury-pillow') imgKey = 'luxury_pillow';
            else if (item.id === 'pumpkin') imgKey = 'item_pumpkin';
            else if (item.id === 'baby-speaki') imgKey = 'item_baby_speaki';

            if (this.images[imgKey]) {
                this.ctx.drawImage(this.images[imgKey], item.x - item.size / 2, item.y - item.size / 2, item.size, item.size);
            }
        });
    }
}


window.onload = () => {
    window.game = new Game();
};

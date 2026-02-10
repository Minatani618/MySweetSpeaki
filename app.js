/**
 * My Sweet Speaki - メインロジック
 */

// 状態定数の定義
const STATE = {
    IDLE: 'idle',
    WANDERING: 'wandering',
    GIFT_LEAVING: 'gift_leaving',
    GIFT_SEARCHING: 'gift_searching',
    GIFT_RETURNING: 'gift_returning',
    GIFT_READY: 'gift_ready',
    INTERACTING: 'interacting'
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
        this.speed = 2;
        this.state = STATE.IDLE;
        this.interruptedState = null;
        this.emotion = 'happy';
        this.action = 'idle';
        this.angle = 0;
        this.lastDecisionTime = 0;
        this.isMoving = false;
        this.arrivalTime = Date.now();
        this.destinationSet = false;
        this.waitDuration = 1000 + Math.random() * 4000; // 最初もバラバラに動くようにランダム化（1~5秒）

        this.facingLeft = true; // 現在向いている方向 (true: 左, false: 右)

        this.distortion = { skewX: 0, rotateX: 0, scale: 1.0 };
        this.targetDistortion = { skewX: 0, rotateX: 0, scale: 1.0 };

        // インタラクション関連
        this.isDragging = false;
        this.dragStartTime = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isActuallyDragging = false;
        this.actionTimeout = null;

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
        this._updateDistortion(dt);
        this.syncSpeakiDOM();

        if (this.isDragging) return;

        this._updateMovementStatus();
        this._processAILogic(Date.now());
        this._processMovement();
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
                console.log(`[Speaki] Asset changed: ${assetKey} -> ${this.currentImgSrc}`);
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
            this.distortion.rotateX *= 0.85;
            this.distortion.scale += (1.0 - this.distortion.scale) * 0.2;
        }
    }

    /** 移動状態の更新判定 */
    _updateMovementStatus() {
        // 1. 到着直後（予定された待機時間以内）であれば、まだ移動を始めない
        if (Date.now() - this.arrivalTime < this.waitDuration && this.state !== STATE.INTERACTING) {
            this.isMoving = false;
            return;
        }

        // すでに移動中なら何もしない
        if (this.isMoving) return;

        // 目的地が設定されていないなら動かない
        if (!this.destinationSet) return;

        // 2. 目的地までの距離を計算
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 3. 一定距離（5px）以上離れていれば移動を開始する
        if (dist > 5) {
            this.isMoving = true;
            // アクションが「待機（idle）」のままなら「歩行（walking）」に切り替える
            if (this.action === 'idle') {
                this.action = 'walking';
            }
        }
    }

    /** AIロジック（個別の判断） */
    _processAILogic(time) {
        // ギフトイベントのトリガーロジックは Game クラスで集中管理するのが良いが、
        // 今回は個々のSpeakiが自律的に判断する形にする（ただしグローバルなCD表示とどう整合取るか課題）
        // -> いったん「ランダム移動」のみ自律とし、イベント系はGameから指令を受ける形にはせず、
        //    既存ロジックを踏襲して「個体が勝手にイベントを始める」形にする。

        // とはいえ全員が一斉にお土産に行っても困るので、
        // 簡易的に「IDが0の個体だけがお土産イベントを担当する」ことにする（仕様確認不足だが安全策）
        const isMainSpeaki = this.id === 0;

        if (isMainSpeaki) {
            // Gameクラス側で管理しているタイマーを参照したいが、結合度を下げるため
            // window.game.lastGiftTime を参照する（荒業だがリファクタリングの範囲内）
            const timeSinceGift = time - window.game.lastGiftTime;
            const countdown = Math.ceil((30000 - timeSinceGift) / 1000);

            // カウントダウン表示更新はGameクラスでやるべきだが、ここに書いてあるロジックを移動させるのが手間
            // いったん「メイン個体」がステータス更新の責任も持つことにする
            let statusText = '準備中...';
            if ([STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING, STATE.GIFT_READY].includes(this.state)) {
                statusText = '発生中...';
            } else if (countdown > 0) {
                statusText = `${countdown}秒`;
            }
            const cdEl = document.getElementById('gift-countdown');
            if (cdEl) cdEl.textContent = statusText;

            if (countdown <= 0 &&
                (this.state === STATE.IDLE || this.state === STATE.WANDERING) &&
                !this.destinationSet) {

                this.state = STATE.GIFT_LEAVING;
                this._decideNextDestination();
                return;
            }
        }

        if (!this.destinationSet && !this.isMoving && (time - this.arrivalTime > this.waitDuration)) {
            this._decideNextDestination();
        }
    }

    /** 次の目的地を決定 */
    _decideNextDestination() {
        const canvasWidth = this.parentElement.clientWidth || window.innerWidth;
        const canvasHeight = this.parentElement.clientHeight || window.innerHeight;

        // 目的地に向かうスピードをランダムに設定 (1.5 ~ 4.5)
        this.speed = 1.5 + Math.random() * 3.0;

        switch (this.state) {
            case STATE.GIFT_LEAVING:
                this.targetX = -200;
                this.targetY = canvasHeight / 2;
                this.action = 'walking';
                break;

            case STATE.GIFT_SEARCHING:
                this.state = STATE.GIFT_RETURNING;
                this.x = -200;
                this.targetX = canvasWidth / 2;
                this.targetY = canvasHeight / 2;
                this.action = 'walking';
                break;

            case STATE.GIFT_RETURNING:
                this.targetX = canvasWidth / 2;
                this.targetY = canvasHeight / 2;
                this.action = 'walking';
                break;

            case STATE.WANDERING:
            case STATE.IDLE:
                this.state = STATE.WANDERING;

                // たまにアイテムに興味を持つ (20%の確率で、配置アイテムがある場合)
                const game = window.game || Game.instance;
                if (game && game.placedItems.length > 0 && Math.random() < 0.2) {
                    const item = game.placedItems[Math.floor(Math.random() * game.placedItems.length)];
                    this.targetItem = item;
                    this.targetX = item.x;
                    this.targetY = item.y;
                    // console.log(`[Speaki ${this.id}] Targets an item: ${item.id}`);
                } else {
                    this.targetItem = null;
                    this.targetX = Math.random() * (canvasWidth - 100) + 50;
                    this.targetY = Math.random() * (canvasHeight - 100) + 50;
                }
                this.action = 'walking';
                break;
        }

        if (this.targetX !== undefined) {
            this.destinationSet = true;
            this.isMoving = true;
            // 移動開始時に画像を再抽選させる
            this.currentImgSrc = '';
        }
    }

    /** 移動処理 */
    _processMovement() {
        // 移動中でなければ何もしない
        if (!this.isMoving) return;

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

    /** 目的地到着時の処理 */
    _handleArrival() {
        // 1. 到着時の物理状態のリセット
        this.arrivalTime = Date.now();
        this.destinationSet = false;

        // 到着時（待機開始時）に画像を再抽選させる
        this.currentImgSrc = '';

        // 待機時間をある程度ランダムに決定 (2秒 ~ 8秒)
        this.waitDuration = 2000 + Math.random() * 6000;

        // 2. 現在のステータスに応じた次の行動の決定
        switch (this.state) {
            // パターン：お土産を取りに画面外（左側）へ到達したとき
            // 次のステップ「探索中（画面外での待機）」へ移行する
            case STATE.GIFT_LEAVING:
                this.state = STATE.GIFT_SEARCHING;
                break;

            // パターン：お土産を持って画面中央のプレイヤーの元へ戻ってきたとき
            // ギフト受け取りイベントUIを開始する
            case STATE.GIFT_RETURNING:
                window.game.startGiftReceiveEvent(this);
                break;

            // パターン：配置されたアイテムに到着した、またはドラッグ後に着地したとき
            case STATE.INTERACTING:
                this._processFinishInteraction();
                break;

            case STATE.WANDERING:
                // パターン：ランダムな「散歩」または「アイテム」の目的地に到着したとき

                // アイテムに対するアクション
                if (this.targetItem) {
                    this._performItemAction(this.targetItem);
                } else {
                    this.state = STATE.IDLE;
                    this.action = 'idle';
                }
                break;
        }
    }

    /** アイテムに到着した際の固有アクション */
    _performItemAction(item) {
        this.state = STATE.INTERACTING;

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

        // 3~6秒間その場で留まる
        this.waitDuration = 3000 + Math.random() * 3000;
        this.targetItem = null;

        // 一定時間後にIDLEに戻る（既存の_processFinishInteractionと似た処理だが、
        // タイマー管理を共通化するためにここではsetTimeoutを使わず、handleArrivalのwaitDuration側に任せる形でも良いが
        // アクションをリセットする必要があるため、setTimeoutで戻す）
        setTimeout(() => {
            if (this.state === STATE.INTERACTING) {
                this.state = STATE.IDLE;
                this.action = 'idle';
                this.emotion = 'happy';
            }
        }, this.waitDuration);
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

        Game.instance = this;

        // アセットの全ファイル名リスト
        // (注) 本来的にはfsなどで自動取得したいが、ブラウザ環境のためリスト化
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
            this.images[baseName] = img; // 後方互換性（furnitureなどの描画用）

            // 2. Speaki用アセットのグループ化 (speaki_感情_行動_番号.png の形式を想定)
            if (fileName.startsWith('speaki_')) {
                // 番号(.png)を除いたキー名を作成 (speaki_happy_wait)
                const parts = fileName.split('_');
                if (parts.length >= 3) {
                    const groupKey = `${parts[0]}_${parts[1]}_${parts[2]}`;
                    if (!this.assetGroups[groupKey]) this.assetGroups[groupKey] = [];
                    this.assetGroups[groupKey].push(path);
                }
            }
        });
    }

    /** グループの中からランダムにひとつの画像パスを返す */
    getRandomAsset(groupKey) {
        const group = this.assetGroups[groupKey];
        if (!group) {
            // 見つからない場合はデフォルトのnormal_waitを探す
            // console.warn(`Asset group not found: ${groupKey}`);
            return this.assetGroups['speaki_normal_wait']?.[0] || '';
        }
        return group[Math.floor(Math.random() * group.length)];
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
            const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING].includes(speaki.state);

            if (isGiftEventActive) {
                speaki.interruptedState = speaki.state;
            } else if (speaki.state === STATE.INTERACTING) {
                // do nothing
            } else {
                speaki.interruptedState = null;
            }

            speaki.state = STATE.INTERACTING;
            speaki.targetX = x; // 複数いると位置が被るが、デモとしてはOK
            speaki.targetY = y;
            speaki.destinationSet = true;
            speaki.isMoving = true;
            speaki.action = 'happy';
        });
    }

    /** マウスダウン処理（Speakiのドラッグ開始） */
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // ヒットテスト（逆順ループで手前のものを優先）
        for (let i = this.speakis.length - 1; i >= 0; i--) {
            const speaki = this.speakis[i];
            const dx = mouseX - speaki.x;
            const dy = mouseY - speaki.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < speaki.size / 2) {
                speaki.isDragging = true;
                speaki.dragStartTime = Date.now();
                speaki.lastMouseX = mouseX;
                speaki.lastMouseY = mouseY;

                // 割り込み判定
                const isGiftEventActive = [STATE.GIFT_LEAVING, STATE.GIFT_SEARCHING, STATE.GIFT_RETURNING].includes(speaki.state);
                if (isGiftEventActive) {
                    if (!speaki.interruptedState) speaki.interruptedState = speaki.state;
                } else if (speaki.state !== STATE.INTERACTING) {
                    speaki.interruptedState = null;
                }

                speaki.state = STATE.INTERACTING;
                speaki.isMoving = false;

                this.draggingSpeaki = speaki; // 現在ドラッグ中の個体を保持
                break; // 1匹だけ掴める
            }
        }
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
        }

        // 2. 表情リセットタイマーの開始（タップまたはドラッグ終了時）
        if (isTap || speaki.isActuallyDragging) {
            this._resetActionTimer(speaki, 2000);
        }

        // 3. 物理的な状態のクリーンアップ
        speaki.isDragging = false;
        speaki.isActuallyDragging = false;
        speaki.isMoving = false;
        speaki.arrivalTime = Date.now();
        speaki.destinationSet = false;

        // 4. 次の状態へ復帰（割り込みがあればそれを優先し、なければIDLEへ）
        speaki.state = speaki.interruptedState || STATE.IDLE;
        speaki.interruptedState = null;

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
        speaki.state = STATE.GIFT_READY;
        speaki.action = 'happy';

        this.updateGiftUI('start');

        // 10秒間反応がなければタイムアウト（寝てしまう）
        this.giftTimeout = setTimeout(() => {
            if (speaki.state !== STATE.GIFT_READY) return;

            speaki.action = 'sleeping';
            this.updateGiftUI('hide');
            document.getElementById('status-emotion').textContent = 'ぐーぐー...';
            setTimeout(() => this.completeGiftEvent(), 5000);
        }, 10000);
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
            this.giftPartner.action = 'happy';
            const emotionEl = document.getElementById('status-emotion');
            emotionEl.textContent = (type === 1) ? 'えへへ、うれしい！' : 'どういたしまして！';
        }

        // 感謝の気持ちを伝えてからイベント終了
        setTimeout(() => this.completeGiftEvent(), 3000);
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
        // または「おさんぽ中」などの全体の状態を表示
        if (this.speakis.length > 0) {
            const mainSpeaki = this.speakis[0];
            let actionText = mainSpeaki.state;
            if (mainSpeaki.state === STATE.WANDERING) actionText = 'おさんぽ中';
            else if (mainSpeaki.state === STATE.IDLE) actionText = '待機中';
            document.getElementById('status-action').textContent = actionText;

            // Debug State表示更新
            const debugStateEl = document.getElementById('status-debug-state');
            if (debugStateEl) debugStateEl.textContent = mainSpeaki.state;
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

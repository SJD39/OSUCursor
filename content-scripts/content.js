class OSUCursor {
    constructor() {
        // 创建html元素
        this.cursorBox = document.createElement('div');
        this.cursorCenter = document.createElement('div');
        this.cursorRing = document.createElement('div');
        this.cursorCenterImg = document.createElement('img');
        this.cursorRingImg = document.createElement('img');
        this.cursorCanvas = document.createElement('canvas');
        this.body = document.getElementsByTagName('body')[0];

        this.cursorBox.id = 'cursorBox';
        this.cursorCenter.id = 'cursorCenter';
        this.cursorRing.id = 'cursorRing';
        this.cursorCanvas.id = 'cursorCanvas';

        this.cursorCanvas.width = window.innerWidth;
        this.cursorCanvas.height = window.innerHeight;

        this.cursorCenterImg.src = chrome.runtime.getURL('./content-scripts/img/cursormiddle@2x.png');
        this.cursorRingImg.src = chrome.runtime.getURL('./content-scripts/img/cursor@2x.png');

        this.cursorBox.append(this.cursorCenter, this.cursorRing);
        this.cursorCenter.append(this.cursorCenterImg);
        this.cursorRing.append(this.cursorRingImg);

        this.body.append(this.cursorCanvas, this.cursorBox);

        // 初始化Canvas
        this.ctx = this.cursorCanvas.getContext("2d");
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#4e91eb';
        this.ctx.lineWidth = 4;

        // 初始化变量
        this.tracePoints = [];
        this.traceLength = 40;
    }

    // 设置Canvas大小
    setCanvasSize() {
        this.cursorCanvas.width = window.innerWidth;
        this.cursorCanvas.height = window.innerHeight;

        this.ctx = this.cursorCanvas.getContext("2d");
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#88bbff';
        this.ctx.lineWidth = 4;
        return;
    }

    // 更新鼠标数据
    addPoint(x, y, t) {
        this.tracePoints.unshift([x, y, t]);
        if (this.tracePoints.length > this.traceLength) {
            this.tracePoints.length = this.traceLength;
        }
        return;
    }

    // 设置指针位置
    setCursorPoint(x, y) {
        this.cursorBox.style.top = y + 'px';
        this.cursorBox.style.left = x + 'px';
        return;
    }

    renewCursorPoint() {
        if (this.tracePoints.length == 0) {
            return;
        }

        this.setCursorPoint(this.tracePoints[0][0], this.tracePoints[0][1]);
        return;
    }

    // 指针可见
    visibleCursor() {
        this.cursorBox.style.opacity = 1;
        return;
    }

    // 指针不可见
    invisibleCursor() {
        this.cursorBox.style.opacity = 0;
        return;
    }

    // 指针变大
    cursorToBig() {
        this.cursorRingImg.style.animation = 'CursorRingBig .14s forwards, CursorRingRotate 6s linear infinite';
        return;
    }

    // 指针变小
    cursorToSmall() {
        this.cursorRingImg.style.animation = 'CursorRingSmall .14s forwards, CursorRingRotate 6s linear infinite';
        return;
    }

    animationLoop() {
        if (this.tracePoints.length == 0) {
            window.requestAnimationFrame(this.animationLoop.bind(this));
            return;
        }

        // 更新光标位置
        this.renewCursorPoint();

        // 绘制轨迹
        let time = new Date().getTime();

        // 清空画布
        this.ctx.clearRect(0, 0, this.cursorCanvas.width, this.cursorCanvas.height);

        this.ctx.beginPath();
        this.ctx.moveTo(this.tracePoints[0][0], this.tracePoints[0][1]);
        for (let i = 1; i < this.tracePoints.length; i++) {
            this.ctx.lineTo(this.tracePoints[i][0], this.tracePoints[i][1]);
            if (time - this.tracePoints[i][2] > 800) {
                this.ctx.globalAlpha = 0;
                this.ctx.stroke();
                break;
            } else {
                this.ctx.globalAlpha = (1 - ((time - this.tracePoints[i - 1][2]) / 800)) * 0.06;
            }

            this.ctx.stroke();
        }
        this.ctx.closePath();

        // 全屏模式显示光标
        if (document.fullscreenElement != null) {
            if (this.cursorBox.parentNode != document.fullscreenElement) {
                document.fullscreenElement.append(this.cursorCanvas, this.cursorBox);
            }
        } else {
            // 保持CursorBox在body最后
            if (this.body.lastChild != this.cursorBox) {
                this.body.append(this.cursorCanvas, this.cursorBox);
            }
        }

        window.requestAnimationFrame(this.animationLoop.bind(this));
    }

}

document.getElementsByTagName('html')[0].style.filter = 'brightness(2.5)';

var CUR;
CUR = new OSUCursor();
CUR.animationLoop();

window.addEventListener('resize', function () {
    CUR.setCanvasSize();
    return;
});

window.addEventListener('mousemove', function (e) {
    CUR.visibleCursor();
    CUR.addPoint(e.clientX, e.clientY, new Date().getTime());
    return;
});

window.addEventListener('mouseover', function (e) {
    if (e.fromElement != null && e.fromElement.localName != 'iframe') {
        return;
    }

    CUR.visibleCursor();
    return;
});

window.addEventListener('mouseout', function (e) {
    if (e.toElement != null && e.toElement.localName != 'iframe') {
        return;
    }

    CUR.invisibleCursor();
    return;
});

window.addEventListener('mousedown', function () {
    CUR.cursorToBig();
    return;
});

window.addEventListener('mouseup', function () {
    CUR.cursorToSmall();
    return;
});
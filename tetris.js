'use strict'
let tetris;
(function() {
let next = null,
    size = {width:8, height:16},
    blocks = [
      [[1,1],[1,1]], [[1,1,1,1]], [[0,1,0],[1,1,1]],
      [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]],
      [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]]
    ],
    block = {shape:null, x:0, y:0},
    stack = [],
    lastDraw = 0,
    needDraw = 0,
    lastBlockShift = 0,
    speed = 1000,
    nextFrameId;
tetris = {
  init:function() {
    let that = this;
    this._initStack();
    window.addEventListener('keypress', function() { that.keyEventHandler.apply(that, arguments)});
    this.startMainLoop();
  },
  stop:function() {
    window.cancelAnimationFrame(nextFrameId);
  },
  addBlock:function() {
    console.log('addBlock');
    let b = Math.floor(Math.random() * blocks.length);
    b = blocks[b];
    block = {shape:b, x:0, y:0};
  },
  startMainLoop:function() {
    let that = this;
    window.requestAnimationFrame(function(time) { 
      that.lastDraw = time;
      that.lastBlockShift = time;
      that.draw();
      that._mainLoop(time);
    });
  },
  _mainLoop:function(time) {
    let that = this;
    nextFrameId = window.requestAnimationFrame(function() { that._mainLoop.apply(that, arguments)});
    if ( time - lastBlockShift > speed ) {
      lastBlockShift = time;
      if ( this.isBlockHit(1,0) ) {
        this.setBlockToStack();
        this.addBlock();
        this.draw();
      } else {
        block.y += 1;
        needDraw = 1;
      }
    }
    if ( block.shape === null ) {
      needDraw = 1;
      this.addBlock();
    }
    if ( needDraw ) {
      needDraw = 0;
      lastDraw = time;
      this.draw();
    }
  },
  keyEventHandler:function(event) {
    console.log(arguments);
    if ( event.key === 'j' && !this.isBlockHit(0,-1) ) {
      block.x = Math.max(block.x - 1, 0);
    } 
    if ( event.key === 'l' && !this.isBlockHit(0,1) ) {
      block.x = Math.min(block.x + 1, size.width - block.shape[0].length);
    }
    if ( event.key === 'i' ) {
      this.rotateBlock();
    }
    if ( event.key === 'k' ) {
      this.landBlock();
    }
    this.draw();
  },
  rotateBlock:function() {
    let w = block.shape[0].length;
    let h = block.shape.length;
    let shape = block.shape;
    let newShape = [];
    for ( let i = 0; i < w; i++) {
      let row = [];
      for ( let j = 0; j < h; j++) {
        row.push(shape[j][w - i - 1]);
      }
      newShape.push(row);
    }
    if (newShape[0].length + block.x > size.width ) {
      block.x = size.width - newShape[0].length;
    }
    let oldShape = block.shape;
    block.shape = newShape;
    if ( this.isBlockHit(0,0) ) {
      block.shape = oldShape;
    }
  },
  findNClearFilledRow:function(rowFrom, rowTo) {
    let j, clearRowIdx = [];
    for ( let i = rowFrom; i < rowTo; i++ ) {
      for ( j = 0; j < size.width; j++ ) {
        if ( stack[i][j] === 0 ) {
          break;
        }
      }
      if ( j === size.width ) {
        clearRowIdx.push(i);
      }
    }
    for ( let i = clearRowIdx.length; i > 0; i-- ) {
      stack.splice(clearRowIdx[i-1],1);
    }
    while(stack.length < size.height) {
      let row = [];
      for (let i = 0 ; i < size.width; i++) {
        row.push(0);
      }
      stack.unshift(row);
    }
    console.log(clearRowIdx);
    return clearRowIdx.length;
  },
  setBlockToStack:function() {
    let shape = block.shape;
    for ( let i = 0 ; i < shape.length ; i++ ) {
      for ( let j = 0 ; j < shape[0].length ; j++ ) {
        let rowIdx = block.y + i;
        let colIdx = block.x + j;
        stack[rowIdx][colIdx] = Math.max(stack[rowIdx][colIdx], block.shape[i][j]);
      }
    }
    this.findNClearFilledRow(block.y, block.y + shape.length);
    block.shape = null;
  },
  landBlock:function() {
    let shape = block.shape;
    while( !this.isBlockHit(1, 0) ) {
      block.y += 1;
    }
  },
  isBlockHit:function(dy, dx) {
    let shape = block.shape;
    let width = shape[0].length;
    let height = shape.length;
    let isHit = false;
    if (block.y + height >= size.height) {
      isHit = true;
    }
    for (let i = 0; i < height && !isHit; i++) {
      for (let j = 0; j < width && !isHit; j++) {
        if ( shape[i][j] === 1 && stack[block.y + i + dy][block.x + j + dx] === 1 ) {
          isHit = true;
        }
      }
    }
    return isHit;
  },
  _initStack:function() {
    for ( let i = 0; i < size.height ; i++) {
      let row = [];
      for (let j = 0; j < size.width; j++) {
        row.push(0);
      }
      stack.push(row);
    }
  },
  draw:function() {
    let s = Date.now();
    this.drawStack();
    this.drawBlock();
    let e = Date.now();
    console.log('draw done in: ' + ( (e-s) / 1000 ) + 's');
  },
  drawStack:function() {
    let el = document.getElementById('stack');
    el.innerHTML = '';
    let html = ''
    stack.forEach(function(row) {
      html += '<div class="row">';
      row.forEach(function(square) {
        if (square) {
          html += '<div class="block"></div>';
        } else {
          html += '<div class="empty"></div>';
        }
      });
      html += '</div>';
    });
    el.innerHTML = html;
  },
  drawBlock:function() {
    if ( block.shape !== null ) {
      let el = document.getElementById('block');
      el.innerHTML = '';
      let html = ''
      block.shape.forEach(function(row) {
        html += '<div class="row">';
        row.forEach(function(square) {
          if (square) {
            html += '<div class="block"></div>';
          } else {
            html += '<div class="empty"></div>';
          }
        });
        html += '</div>';
      });
      el.innerHTML = html;
      el.style.top = (block.y * 10) + 'px';
      el.style.left = (block.x * 10) + 'px';
    }
  }
};
})();

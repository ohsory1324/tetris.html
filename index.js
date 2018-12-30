const LEFT_KEY = 37;
const UP_KEY = 38;
const RIGHT_KEY = 39;
const DOWN_KEY = 40;
const SPACE_KEY = 32;
const BLOCK_COLORS = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#f50'];
const BLOCKS = {
  0: [[0, 4], [0, 5], [1, 4], [1, 5]], // ㅁ
  1: [[0, 3], [0, 4], [0, 5], [0, 6]], // ㅡ
  2: [[0, 3], [1, 3], [1, 4], [1, 5]], // ㄴ
  3: [[0, 5], [1, 5], [1, 4], [1, 3]], // ㄴ 반대
  4: [[0, 4], [1, 4], [1, 3], [1, 5]], // ㅗ
  5: [[0, 3], [0, 4], [1, 4], [1, 5]], // ㄹ
  6: [[0, 4], [0, 5], [1, 4], [1, 3]], // ㄹ 반대
};

let moveDownDelay = 1000;
let moveDownInterval;
let score = 0;
let nextBlockType;

const titleScreen = document.getElementById('title');
const gameoverScreen = document.getElementById('gameover');
const pausedScreen = document.getElementById('paused');
const cells = document.getElementById('cells');
const nextBlockPreview = document.getElementById('next-block-preview');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const scoreDiv = document.getElementById('score');

const init = () => {
  cells.innerHTML = '';
  for (let i = 0; i < 200; i += 1) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cells.append(cell);
  }
  resetMoveDownInterval();
  initNextBlock();
};

const resetMoveDownInterval = () => {
  if (moveDownInterval) {
    clearInterval(moveDownInterval);
    moveDownInterval = null;
  }
};

const getCell = (row, col) => cells.children[row * 10 + col];

const isLandedCell = (...args) => {
  if (args.length === 1) {
    return args[0].classList.contains('landed');
  }
  if (args.length === 2) {
    return isLandedCell(getCell(args[0], args[1]));
  }
  return null;
};

const isBlockCell = (...args) => {
  if (args.length === 1) {
    return args[0].classList.contains('block');
  }
  if (args.length === 2) {
    return isBlockCell(getCell(args[0], args[1]));
  }
  return null;
};

const turnOffScreens = () => {
  titleScreen.classList.remove('screen-on');
  gameoverScreen.classList.remove('screen-on');
  pausedScreen.classList.remove('screen-on');
};

const turnOnScreen = (type) => {
  turnOffScreens();
  if (type === 'title') {
    return titleScreen.classList.add('screen-on');
  }
  if (type === 'gameover') {
    return gameoverScreen.classList.add('screen-on');
  }
  if (type === 'paused') {
    return pausedScreen.classList.add('screen-on');
  }
  return;
};

const setScore = (nextScore) => {
  score = nextScore;
  scoreDiv.innerText = score;
  moveDownDelay = Math.max(100, 1000 - score / 10);
};

const changeTo = (cell, type, color) => {
  if (type === 'empty') {
    cell.style.background = 'lightgray';
    cell.className = 'cell';
  } else {
    cell.style.background = color;
    cell.classList.add(type);
  }
};

const initNextBlock = () => {
  nextBlockPreview.innerHTML = '';
  for (let i = 0; i < 24; i += 1) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    nextBlockPreview.append(cell);
  }
};

const setNextBlock = () => {
  initNextBlock();
  nextBlockType = Math.round(Math.random() * 6);
  const nextBlockColor = BLOCK_COLORS[nextBlockType];
  BLOCKS[nextBlockType].map(([rowIndex, colIndex]) => [rowIndex + 1, colIndex - 2])
    .forEach(([rowIndex, colIndex]) => {
      const cell = nextBlockPreview.children[rowIndex * 6 + colIndex];
      cell.style.background = nextBlockColor;
    });
};

const makeBlock = (type) => {
  const color = BLOCK_COLORS[type];
  const isGameover = BLOCKS[type].reduce((total, [rowIndex, colIndex]) => {
    return total || isLandedCell(rowIndex, colIndex);
  }, false);
  const changeCellToBlock = ([rowIndex, colIndex]) => {
    const cell = getCell(rowIndex, colIndex);
    cell.classList.add(`type-${type}`);
    cell.classList.add('rotate-0');
    changeTo(cell, 'block', color);
  };
  setNextBlock();
  if (isGameover) {
    BLOCKS[type].filter(([rowIndex]) => rowIndex === 1)
      .map(([_, colIndex]) => [0, colIndex])
      .forEach(changeCellToBlock);
    return moveBlock('down');
  }
  return BLOCKS[type].forEach(changeCellToBlock);
};

const checkGameOver = () => {
  for (let colIndex = 0; colIndex < 10; colIndex += 1) {
    if (isLandedCell(0, colIndex)) {
      return true;
    }
  }
  return false;
};

const checkCollision = (direction) => {
  for (let rowIndex = 0; rowIndex < 20; rowIndex += 1) {
    for (let colIndex = 0; colIndex < 10; colIndex += 1) {
      if (isBlockCell(rowIndex, colIndex)) {
        const hasCollision = (direction === 'down' && (rowIndex === 19 || isLandedCell(rowIndex + 1, colIndex)))
          || (direction === 'left' && (colIndex === 0 || isLandedCell(rowIndex, colIndex - 1)))
          || (direction === 'right' && (colIndex === 9 || isLandedCell(rowIndex, colIndex + 1)));
        if (hasCollision) {
          return true;
        }
      }
    }
  }
  return false;
};

const gameOver = () => {
  [...document.getElementsByClassName('landed')].forEach((cell) => {
    cell.style.background = 'gray';
  });
  resetMoveDownInterval();
  turnOnScreen('gameover');
  pauseBtn.style.display = 'none';
  startBtn.style.display = 'inline-block';
};

const moveBlock = (direction) => {
  let blockColor = '';
  let className = '';
  const nextBlocks = [];

  if (checkCollision(direction)) {
    if (direction === 'down') {
      blockToLanded();
      resetMoveDownInterval();
      clearLines();
      if (checkGameOver()) {
        gameOver();
      } else {
        doStage();
      }
    }
    return false;
  }

  for (let rowIndex = 0; rowIndex < 20; rowIndex += 1) {
    for (let colIndex = 0; colIndex < 10; colIndex += 1) {
      const curCell = getCell(rowIndex, colIndex);
      if (isBlockCell(curCell)) {
        className = curCell.className;
        blockColor = curCell.style.background;
        changeTo(curCell, 'empty');

        let nextCell;
        if (direction === 'down') {
          nextCell = getCell(rowIndex + 1, colIndex);
        } else if (direction === 'left') {
          nextCell = getCell(rowIndex, colIndex - 1);
        } else if (direction === 'right') {
          nextCell = getCell(rowIndex, colIndex + 1);
        }
        nextBlocks.push(nextCell);
      }
    }
  }
  nextBlocks.forEach((eachCell) => {
    eachCell.className = className;
    changeTo(eachCell, 'block', blockColor);
  });
  return true;
};

const rotateBlock = () => {
  const blockCells = [...document.getElementsByClassName('block')];
  const color = blockCells[0].style.background;
  const className = blockCells[0].className;
  let type = [...blockCells[0].classList].find(c => c.includes('type'));
  let rotate = [...blockCells[0].classList].find(c => c.includes('rotate'));
  type = +type.substr(5);
  rotate = +rotate.substr(7);
  let nextRotate;
  let nextBlockCells = [];

  const first = blockCells[0];
  const cellIndex = [...cells.children].indexOf(first);
  const firstRow = Math.floor(cellIndex / 10);
  const firstCol = cellIndex % 10;
  if (type === 1) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow - 1, firstCol + 1],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
      ];
    } else {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow + 1, firstCol - 1],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
        [firstRow + 1, firstCol + 2],
      ];
    }
  } else if (type === 2) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow, firstCol + 1],
        [firstRow, firstCol + 2],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
      ];
    } else if (rotate === 1) {
      nextRotate = 2;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
      ];
    } else if (rotate === 2) {
      nextRotate = 3;
      nextBlockCells = [
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
        [firstRow + 2, firstCol],
      ];
    } else if (rotate === 3) {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow + 1, firstCol - 1],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
      ];
    }
  } else if (type === 3) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow + 1, firstCol - 1],
        [firstRow + 2, firstCol - 1],
        [firstRow + 2, firstCol],
      ];
    } else if (rotate === 1) {
      nextRotate = 2;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol - 1],
      ];
    } else if (rotate === 2) {
      nextRotate = 3;
      nextBlockCells = [
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
      ];
    } else if (rotate === 3) {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow, firstCol + 2],
        [firstRow + 1, firstCol + 2],
        [firstRow + 1, firstCol + 1],
        [firstRow + 1, firstCol],
      ];
    }
  } else if (type === 4) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow, firstCol],
        [firstRow + 1, firstCol],
        [firstRow + 2, firstCol],
        [firstRow + 1, firstCol + 1],
      ];
    } else if (rotate === 1) {
      nextRotate = 2;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol],
      ];
    } else if (rotate === 2) {
      nextRotate = 3;
      nextBlockCells = [
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
        [firstRow + 1, firstCol],
      ];
    } else if (rotate === 3) {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow, firstCol],
        [firstRow + 1, firstCol - 1],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
      ];
    }
  } else if (type === 5) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol + 1],
        [firstRow + 1, firstCol],
        [firstRow + 2, firstCol],
      ];
    } else if (rotate === 1) {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow, firstCol - 1],
        [firstRow, firstCol],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
      ];
    }
  } else if (type === 6) {
    if (rotate === 0) {
      nextRotate = 1;
      nextBlockCells = [
        [firstRow, firstCol],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol + 1],
        [firstRow + 2, firstCol + 1],
      ];
    } else if (rotate === 1) {
      nextRotate = 0;
      nextBlockCells = [
        [firstRow, firstCol],
        [firstRow, firstCol + 1],
        [firstRow + 1, firstCol],
        [firstRow + 1, firstCol - 1],
      ];
    }
  } else {
    return;
  }

  let canRotate = true;
  nextBlockCells = nextBlockCells.map(([row, col]) => {
    const nextBlockCell = getCell(row, col);
    if (row < 0 || row > 19 || col < 0 || col > 9 || isLandedCell(nextBlockCell)) {
      canRotate = false;
    }
    return nextBlockCell;
  });
  if (canRotate) {
    blockCells.forEach(cell => changeTo(cell, 'empty'));
    nextBlockCells.forEach((nextBlockCell) => {
      changeTo(nextBlockCell, 'block', color);
      nextBlockCell.className = className;
      nextBlockCell.classList.remove(`rotate-${rotate}`);
      nextBlockCell.classList.add(`rotate-${nextRotate}`);
    });
  }
};

const blockToLanded = () => {
  const blockCells = document.getElementsByClassName('block');
  [...blockCells].forEach((curCell) => {
    curCell.classList.remove('block');
    curCell.classList.add('landed');
  });
};

const moveDownLanded = (rowIndex, count) => {
  for (let colIndex = 0; colIndex < 10; colIndex += 1) {
    const curCell = getCell(rowIndex, colIndex);
    if (isLandedCell(curCell)) {
      const color = curCell.style.background;
      changeTo(curCell, 'empty');
      changeTo(getCell(rowIndex + count, colIndex), 'landed', color);
    }
  }
};

const clearLines = () => {
  const fullFilledRows = [];
  for (let rowIndex = 0; rowIndex < 20; rowIndex += 1) {
    let isFullFilled = true;
    for (let colIndex = 0; colIndex < 10; colIndex += 1) {
      if (!isLandedCell(rowIndex, colIndex)) {
        isFullFilled = false;
        break;
      }
    }
    if (isFullFilled) {
      fullFilledRows.push(rowIndex);
    }
  }
  fullFilledRows.forEach((rowIndex) => {
    for (let colIndex = 0; colIndex < 10; colIndex += 1) {
      changeTo(getCell(rowIndex, colIndex), 'empty');
    }
  });

  const moveDownCounts = {};
  let clearCount = 0;
  for (let rowIndex = fullFilledRows[fullFilledRows.length - 1]; rowIndex >= 0; rowIndex -= 1) {
    if (fullFilledRows.includes(rowIndex)) {
      clearCount += 1;
    } else {
      moveDownCounts[rowIndex] = clearCount;
    }
  }
  Object.entries(moveDownCounts)
    .sort((a, b) => b[0] - a[0])
    .forEach(([rowIndex, count]) => {
      moveDownLanded(+rowIndex, count);
    });
  
  setScore(score + (1 + fullFilledRows.length) * fullFilledRows.length * 25);
};

const doStage = () => {
  makeBlock(nextBlockType);
  moveDownInterval = setInterval(() => {
    moveBlock('down');
  }, moveDownDelay);
};

const startGame = () => {
  init();
  setNextBlock();
  setScore(0);
  turnOffScreens();
  doStage();
  startBtn.blur();
  startBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
};

const togglePause = () => {
  const text = pauseBtn.innerText;
  if (text === '일시정지') {
    return pauseGame();
  }
  if (text === '계속하기') {
    return continueGame();
  }
  return;
};

const pauseGame = () => {
  resetMoveDownInterval();
  pauseBtn.innerText = '계속하기';
  turnOnScreen('paused');
};

const continueGame = () => {
  moveDownInterval = setInterval(() => {
    moveBlock('down');
  }, moveDownDelay);
  pauseBtn.innerText = '일시정지';
  turnOffScreens();
};

init();
document.addEventListener('keydown', (e) => {
  if (moveDownInterval && !checkGameOver()) {
    if (e.keyCode === LEFT_KEY) {
      moveBlock('left');
    } else if (e.keyCode === RIGHT_KEY) {
      moveBlock('right');
    } else if (e.keyCode === DOWN_KEY) {
      moveBlock('down');
    } else if (e.keyCode === UP_KEY) {
      rotateBlock();
    } else if (e.keyCode === SPACE_KEY) {
      let landed = true;
      let count = 0;
      while (landed) {
        landed = moveBlock('down');
        count += 1;
      }
      setScore(score + (count - 1) * 2);
    }
  }
});

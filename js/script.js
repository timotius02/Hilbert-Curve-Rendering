const MAX_ORDER = 7;
const WIDTH = 400;

let counter;
let path;
let nextPath;

const drawLine = (begin, end, ctx, imageCtx) => {
  const beginColor = imageCtx.getImageData(begin[0], begin[1], 1, 1).data;
  const endColor = imageCtx.getImageData(end[0], end[1], 1, 1).data;
  const avgColor = 
    [Math.round((beginColor[0] + endColor[0]) / 2),
     Math.round((beginColor[1] + endColor[1]) / 2), 
     Math.round((beginColor[2] + endColor[2]) / 2)];
  
  ctx.strokeStyle = `rgb(${avgColor[0]}, ${avgColor[1]}, ${avgColor[2]})`;

  ctx.beginPath();
  ctx.moveTo(begin[0], begin[1]);
  ctx.lineTo(end[0], end[1]);
  ctx.stroke();
};

const last2bits = (x) => x & 3;

// converts index to x, y
const hilbert = (i, order) => {
  const positions = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0]
  ];

  let position = positions[last2bits(i)];
  let x = position[0];
  let y = position[1];

  for (let j = 1; j < order; j++) {
    let temp;
    let len = Math.pow(2, j);

    i = i >> 2;
    switch (last2bits(i)) {
      case 0:
        temp = x;
        x = y;
        y = temp;
        break;

      case 1:
        y += len;
        break;

      case 2:
        x += len;
        y += len;
        break;

      case 3:
        temp = x;
        x = len - 1 - y;
        y = len - 1 - temp;
        x += len;
        break;
    }
  }

  return [x, y];
};

// returns interpolated state given start:[x, y], end: [x, y], p[0,1]
const interpolate = (start, end, p) => {
  let x = start[0] + (end[0] - start[0]) * p;
  let y = start[1] + (end[1] - start[1]) * p;

  return [x, y];
};

const draw = (order, ctx, imageCtx) => {
    ctx.clearRect(0, 0, 500, 500);

    for (let i = 1; i < path.length; i++) {
      let point1 = interpolate(path[i - 1], nextPath[i - 1], counter);
      let point2 = interpolate(path[i], nextPath[i], counter);

      drawLine(point1, point2, ctx, imageCtx);
    }

    let nextCount = order <= 5? counter + 0.1 : counter + 0.5;

    counter = parseFloat(nextCount.toFixed(1));

    if (counter > 1) {
      if (order === MAX_ORDER) {
        return;
      }  
      counter = 0;
      path = [];
      nextPath = [];
      order++;
      setupPaths(order);
    }
    requestAnimationFrame(draw.bind(null, order, ctx, imageCtx));

};


const drawStatic = (order, ctx, imageCtx) => {
  let currentPath = [];
  const N = Math.pow(2, order);
  for (let i = 0; i < N * N; i++) {
    currentPath[i] = convert(hilbert(i, order), order);
  }

  for (let i = 1; i < currentPath.length; i++) {
    drawLine(currentPath[i - 1], currentPath[i], ctx, imageCtx);
  }
}

const convert = (point, order) => {
  const N = Math.pow(2, order);
  const len = WIDTH / N;
  let x = point[0] * len + len / 2;
  let y = point[1] * len + len / 2;
  return [x, y];
};

const setupPaths = (order) => {
  let currentPath = [];
  const N = Math.pow(2, order);
  for (let i = 0; i < N * N; i++) {
    currentPath[i] = convert(hilbert(i, order), order);
  }
  nextPath = [];
  const N2 = Math.pow(2, order + 1);

  for (let j = 0; j < N2 * N2; j++) {
    nextPath[j] = convert(hilbert(j, order + 1), order + 1);

    // break current path into the same number of lines as the nextPath

    const nearestIndex = Math.floor((j / (N2 * N2)) * N * N);

    path[j] = interpolate(
      currentPath[nearestIndex],
      currentPath[
        nearestIndex + 1 === currentPath.length
          ? nearestIndex
          : nearestIndex + 1
      ],
      (j / (N2 * N2)) * N * N - nearestIndex
    );
  }
};


const setupImage = (image) => {
  
  const imageCanvas = document.createElement("canvas");
  imageCanvas.width = WIDTH;
  imageCanvas.height = WIDTH;
  const imageCtx = imageCanvas.getContext("2d");
  imageCtx.drawImage(image, 0, 0, WIDTH, WIDTH);

  return imageCtx;
}

const renderImage = (image, canvas) => {
  const ctx = canvas.getContext("2d");
  const imageCtx = setupImage(image);
  counter = 0;
  path = [];
  nextPath = [];
  setupPaths(1);
  draw(1, ctx, imageCtx);
}

const image2 = new Image(WIDTH, WIDTH);
image2.src = "./img/mona_lisa.jpg";
image2.onload = () => {
  const imageCtx = setupImage(image2);

  const canvas2 = document.querySelector("#canvas2");
  const ctx2 = canvas2.getContext("2d");
  drawStatic(MAX_ORDER + 1, ctx2, imageCtx);
}

function uploadImage(e){
  let reader = new FileReader();
  reader.onload = function(event){
      let img = new Image(WIDTH, WIDTH);
      img.onload = function() {
          const canvas = document.querySelector("#canvas");
          renderImage(img, canvas);
      }
      img.src = event.target.result;
  }
  reader.readAsDataURL(e.target.files[0]); 
}

function defaultImage() {
  const image = new Image(WIDTH, WIDTH);
  image.src = "./img/the_scream.jpg";
  image.onload = () => {
    const canvas = document.querySelector("#canvas");
    renderImage(image, canvas);
  }
}

defaultImage();
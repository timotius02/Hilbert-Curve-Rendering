const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

const width = 500;
const MAX_ORDER = 7;


// setup hidden image canvas
const image = document.getElementById("source");
const canvas2 = document.createElement("canvas");
canvas2.width = width;
canvas2.height = width;
const ctx2 = canvas2.getContext("2d");


let counter;
let path;
let nextPath;

const drawLine = (begin, end) => {
  const beginColor = ctx2.getImageData(begin[0], begin[1], 1, 1).data;
  const endColor = ctx2.getImageData(end[0], end[1], 1, 1).data;
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

const draw = (order) => {

    if (counter > 1) {
      if (order > MAX_ORDER) {
  
        return;
      }
      
      counter = 0;
      path = [];
      nextPath = [];
      setupPaths(order);
      order++;
    }

    ctx.clearRect(0, 0, 500, 500);

    for (let i = 1; i < path.length; i++) {
      let point1 = interpolate(path[i - 1], nextPath[i - 1], counter);
      let point2 = interpolate(path[i], nextPath[i], counter);

      drawLine(point1, point2);
    }

    let nextCount = counter + 0.1;

    counter = parseFloat(nextCount.toFixed(1));

    requestAnimationFrame(draw.bind(null, order));

};

const convert = (point, order) => {
  const N = Math.pow(2, order);
  const len = width / N;
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


image.onload = () => {
  ctx2.drawImage(image, 0, 0, width, width);

  counter = 0;
  path = [];
  nextPath = [];
  setupPaths(1);
  draw(1);
}

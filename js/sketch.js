const x_vals = []
const y_vals = []

const learning_rate = 0.2
const optimizer = tf.train.sgd(learning_rate)

let isLooping = true
let loss = 0

let lrSlider, pauseButton, resetButton, randomizeButton
let m, b

async function setup() {
  createCanvas(
    windowWidth * (windowWidth > 450 ? 0.8 : 0.9),
    windowHeight * 0.8
  ).parent('canvas-content')

  m = tf.scalar(0).variable()
  b = tf.scalar(0).variable()

  lrSlider = select('#lr-slider')
  randomizeButton = select('#randomize-btn')
  pauseButton = select('#pause-btn')
  resetButton = select('#reset-btn')

  lrSlider.value(learning_rate)

  randomizeButton.mousePressed(() => {
    clearData()
    x_vals.push(
      ...Array(floor(random(5, 30)))
        .fill()
        .map((v, i, c) => map(i + random(1), 0, c.length, -1, 1))
    )

    y_vals.push(...x_vals.map(x => x + random(abs(x) - 1, 1 - abs(x))))
  })

  pauseButton.mousePressed(() => {
    if (isLooping) {
      noLoop()
      pauseButton.html('Resume!')
    } else {
      loop()
      pauseButton.html('Pause!')
    }

    isLooping = !isLooping
  })

  resetButton.mousePressed(clearData)
}

function clearData() {
  x_vals.splice(0, x_vals.length)
  y_vals.splice(0, y_vals.length)
}

function windowResized() {
  resizeCanvas(
    windowWidth * (windowWidth > 450 ? 0.8 : 0.9),
    windowHeight * 0.8
  )
}

function draw() {
  background('#333')

  optimizer.setLearningRate(lrSlider.value())

  if (x_vals.length) {
    tf.tidy(() => {
      const xs = tf.tensor1d(x_vals)
      const ys = tf.tensor1d(y_vals)

      loss = optimizer
        .minimize(() => tf.losses.meanSquaredError(ys, predict(xs)), true)
        .dataSync()
    })
  } else {
    noStroke()
    fill('#999')
    textSize(20)
    textAlign(CENTER)
    text('Click Anywhere!', width / 2, height * 0.25)
  }

  drawGraph()
  drawText()
  drawGraphData()
  drawRegressionLine()
}

function predict(x) {
  return m.mul(x).add(b) // y = mx + b
}

function mouseClicked() {
  if (mouseX < width && mouseY < height) {
    x_vals.push(normalizeX(mouseX))
    y_vals.push(normalizeY(mouseY))
  }
}

function drawRegressionLine() {
  // predict for -1 and 1
  const y = tf.tidy(() => predict(tf.tensor1d([-1, 1])).dataSync())

  const x1 = denormalizeX(-1) // x1 = -1 or 0 width
  const x2 = denormalizeX(1) // x2 = 1 or full width

  const y1 = denormalizeY(y[0]) // y = predict(-1)
  const y2 = denormalizeY(y[1]) // y = predict(1)

  stroke('#1dd1a1')
  strokeWeight(1)
  line(x1, y1, x2, y2)
}

function drawText() {
  fill('#999')
  noStroke()
  textSize(15)
  textAlign(CENTER)
  text(x_vals.length, width - 20, 15)
  textAlign(LEFT)
  text(`Learning Rate : ${optimizer.learningRate}`, 2, height - 50)
  text(`Loss : ${loss}`, 2, height - 35)
  text(`m : ${m.dataSync()}`, 2, height - 20)
  text(`b : ${b.dataSync()}`, 2, height - 5)
}

function drawGraphData() {
  const xs = x_vals.map(denormalizeX)
  const ys = y_vals.map(denormalizeY)

  // sorted x data to draw conected points
  const pair = xs.map((x, i) => ({ x, y: ys[i] }))
  pair.sort((a, b) => a.x - b.x)

  for (let i = 0; i < xs.length; i++) {
    // draw loss
    tf.tidy(() => {
      const x = tf.tensor1d([x_vals[i]])
      const guess = predict(x).dataSync()

      stroke('#ee5253')
      strokeWeight(1)
      line(xs[i], ys[i], xs[i], denormalizeY(guess))
    })

    // draw line connection
    if (pair[i + 1]) {
      stroke('#454545')
      strokeWeight(0.5)
      line(pair[i].x, pair[i].y, pair[i + 1].x, pair[i + 1].y)
    }

    // draw dot points
    stroke('#2e86de')
    strokeWeight(8)
    point(xs[i], ys[i])
  }
}

function drawGraph() {
  stroke('#999')
  strokeWeight(1)
  line(width / 2, 0, width / 2, height)
  line(0, height / 2, width, height / 2)
}

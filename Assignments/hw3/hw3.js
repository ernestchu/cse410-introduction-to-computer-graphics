const NumTimesToSubdivide = 3
var step = 1.5
// const vertices = [
//   vec3(  0.0,  1.00,  0.86 ),
//   vec3( -1.0, -0.73,  0.86 ),
//   vec3(  1.0, -0.73,  0.86 ),
//   vec3(  0.0,  0.00, -1.00 )
// ]
const vertices = [
  vec3(  0.0,  0.78,  0.33 ),
  vec3( -0.7, -0.43,  0.33 ),
  vec3(  0.7, -0.43,  0.33 ),
  vec3(  0.0,  0.00, -0.98 )
]
const baseColors = [
  vec3(0.3, 0, 0),
  vec3(0.66, 0.02, 0.06),
  vec3(0.92, 0.57, 0.60),
  vec3(0.88, 0.29, 0.33)
]
const points = []
const colors = []
const thetas = [ 0, 0, 0 ]
const xAxis = 0
const yAxis = 1
const zAxis = 2
var axis = zAxis
var scaleRate = 1
var enable = true
var wires = false
var gl
var program

window.onload = () => {
  canvas = document.getElementById('gl-canvas')

  setupEventListeners()

  gl = WebGLUtils.setupWebGL(canvas)
  if (!gl) { alert('WebGL isn\'t available') }

  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(1.0, 1.0, 1.0, 1,0)

  program = initShaders(gl, 'vertex-shader', 'fragment-shader')
  gl.useProgram(program)

  divideTetra(...vertices, NumTimesToSubdivide)
  // color buffer
  const cBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW)
  const vColor = gl.getAttribLocation(program, 'vColor')
  gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vColor)

  // vertex buffer
  const vBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW)
  const vPosition = gl.getAttribLocation(program, 'vPosition')
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vPosition)

  window.addEventListener('resize', resizeCanvas, false)

  function resizeCanvas () {
    canvas.width = window.innerWidth - 20
    canvas.height = window.innerHeight - 200

    if (canvas.width > canvas.height) canvas.width = canvas.height
    else canvas.height = canvas.width

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
  }

  resizeCanvas()
  requestAnimFrame(render)
}

function triangle (a, b, c, color) {
  for (const v of [ a, b, c ]) {
    colors.push(baseColors[color])
    points.push(v)
  }
}

function tetra(a, b, c, d) {
  triangle(a, c, b, 0)
  triangle(a, c, d, 1)
  triangle(a, b, d, 2)
  triangle(b, c, d, 3)
}

function divideTetra (a, b, c, d, count) {
  if (count === 0) {
    tetra(a, b, c, d)
  } else {
    const ab = mix(a, b, .5)
    const ac = mix(a, c, .5)
    const ad = mix(a, d, .5)
    const bc = mix(b, c, .5)
    const bd = mix(b, d, .5)
    const cd = mix(c, d, .5)

    --count

    divideTetra(a, ab, ac, ad, count)
    divideTetra(ab, b, bc, bd, count)
    divideTetra(ac, bc, c, cd, count)
    divideTetra(ad, bd, cd, d, count)
  }
}

function render () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  thetas[axis] += enable ? step : 0
  let ctm = scale(scaleRate, scaleRate, scaleRate)
  ctm = mult(ctm, rotateX(thetas[xAxis]))
  ctm = mult(ctm, rotateY(thetas[yAxis]))
  ctm = mult(ctm, rotateZ(thetas[zAxis]))
  const modelViewMatrix = gl.getUniformLocation(program, 'modelViewMatrix')
  gl.uniformMatrix4fv(modelViewMatrix, false, flatten(ctm))
  gl.drawArrays(wires ? gl.LINE_LOOP : gl.TRIANGLES, 0, points.length)

  requestAnimFrame(render)
}

function rotateX (theta) {
  const angles = radians(theta)
  const c = Math.cos(angles)
  const s = Math.sin(angles)

  return mat4(
    1.0,  0.0,  0.0,  0.0,
    0.0,  c,  s,  0.0,
    0.0, -s,  c,  0.0,
    0.0,  0.0,  0.0,  1.0
  )
}

function rotateY (theta) {
  const angles = radians(theta)
  const c = Math.cos(angles)
  const s = Math.sin(angles)

  return mat4(
    c,  0.0, -s,  0.0,
    0.0,  1.0,  0.0,  0.0,
    s,  0.0,  c,  0.0,
    0.0,  0.0,  0.0,  1.0
  )
}

function rotateZ (theta) {
  const angles = radians(theta)
  const c = Math.cos(angles)
  const s = Math.sin(angles)

  return mat4(
     c,  s,  0.0,  0.0,
    -s,  c,  0.0,  0.0,
     0.0,  0.0,  1.0,  0.0,
     0.0,  0.0,  0.0,  1.0
  )
}

function scale (x, y, z) {
  const result = mat4()
  result[0][0] = x
  result[1][1] = y
  result[2][2] = z

  return result
}

function setupEventListeners () {
  document.getElementById('toggle').onclick = event => {
    event.target.innerText = (event.target.innerText === 'Pause') ? 'Resume' : 'Pause'
    enable = !enable
  }
  document.getElementById('xButton').onclick = () => {
    axis = xAxis
    document.getElementById('toggle').innerText = 'Pause'
    enable = true
  }
  document.getElementById('yButton').onclick = () => {
    axis = yAxis
    document.getElementById('toggle').innerText = 'Pause'
    enable = true
  }
  document.getElementById('zButton').onclick = () => {
    axis = zAxis
    document.getElementById('toggle').innerText = 'Pause'
    enable = true
  }
  document.getElementById('wires').onclick = () => {
    wires = ! wires
  }
  document.getElementById('speed').value = step
  document.getElementById('speed').onchange = event => {
    step = parseFloat(event.target.value)
  }
  document.getElementById('scale').oninput = event => {
    document.getElementById('scaleIndicator').innerText = parseFloat(event.target.value).toFixed(2) + 'x'
    scaleRate = parseFloat(event.target.value)
  }
}

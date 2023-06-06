var NumTimesToSubdivide = 5
const vertices = [
  vec4( 0.0,       0.0,      -1.0,      1),
  vec4( 0.0,       0.942809,  0.333333, 1),
  vec4(-0.816497, -0.471405,  0.333333, 1),
  vec4( 0.816497, -0.471405,  0.333333, 1)
]

var   lightPosition1    = vec3(
                            Math.sin(45 * Math.PI / 180),
                            Math.cos(45 * Math.PI / 180),
                            1.0
                          )
var   lightPosition2    = vec3(
                            0.0,
                            Math.sin(300 * Math.PI / 180),
                            Math.cos(300 * Math.PI / 180)
                          )
const lightAmbient  = vec4(0.1, 0.1, 0.1, 1.0)
const lightDiffuse  = vec4(0.6, 0.6, 0.6, 1.0)
const lightSpecular = vec4(1.0, 1.0, 1.0, 1.0)
var materialShininess = 100.0

const materialAmbientCandidates = {
  plastic: vec4(1.0,  1.0,  1.0,  1.0),
  metal:   vec4(1.0,  1.0,  1.0,  1.0),
  carbon:  vec4(0.1,  0.1,  0.1,  1.0)
}
const materialDiffuseCandidates = {
  plastic: vec4(0.66, 0.02, 0.06, 1.0),
  metal:   vec4(0.4,  0.4,  0.4,  1.0),
  carbon:  vec4(0.2,  0.2,  0.2,  1.0)
}
const materialSpecularCandidates = {
  plastic: vec4(0.5,  0.3,  0.3,  1.0),
  metal:   vec4(0.65, 0.65, 0.65, 1.0),
  carbon:  vec4(0.1,  0.1,  0.1,  1.0)
}

var near   = -10;
var far    =  10;
var left   = -1.0;
var right  =  1.0;
var ytop   =  1.0;
var bottom = -1.0;

var shading = 'phong'

var points  = []
var normals = []
var reloadPoints = true
var gl
var program

function init () {
  tetra(...vertices, NumTimesToSubdivide)
  reloadPoints = false

  const nBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW)
  const vNormal = gl.getAttribLocation(program, 'vNormal')
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vNormal)

  const vBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW)
  const vPosition = gl.getAttribLocation(program, 'vPosition')
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vPosition)

  lighting()

  const projectionMatrix = ortho(left, right, bottom, ytop, near, far);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  )

  window.addEventListener('resize', resizeCanvas, false)

  function resizeCanvas () {
    canvas.width = window.innerWidth - 20
    canvas.height = window.innerHeight - 280

    if (canvas.width > canvas.height) canvas.width = canvas.height
    else canvas.height = canvas.width

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(1.0, 1.0, 1.0, 1.0)
    render()
  }
  resizeCanvas()
}
function lighting () {
  const material = document.querySelector('input[name="material"]:checked').value
  const ambientProduct  = mult(lightAmbient,  materialAmbientCandidates[material])
  const diffuseProduct  = mult(lightDiffuse,  materialDiffuseCandidates[material])
  const specularProduct = mult(lightSpecular, materialSpecularCandidates[material])

  gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),  flatten(ambientProduct))
  gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),  flatten(diffuseProduct))
  gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct))
  gl.uniform3fv(gl.getUniformLocation(program, "lightPosition1"),  flatten(lightPosition1))
  gl.uniform3fv(gl.getUniformLocation(program, "lightPosition2"),  flatten(lightPosition2))
  gl.uniform1f (gl.getUniformLocation(program, "shininess"),       materialShininess)
  gl.uniform1i(gl.getUniformLocation(program, "enablePhong"), shading === 'phong')

  render()
}

window.onload = () => {
  canvas = document.getElementById('gl-canvas')
  gl = WebGLUtils.setupWebGL(canvas)
  if (!gl) { alert('WebGL isn\'t available') }

  setupEventListeners()

  gl.enable(gl.DEPTH_TEST)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(1.0, 1.0, 1.0, 1,0)

  program = initShaders(gl, 'vertex-shader', 'fragment-shader')
  gl.useProgram(program)

  init()
}

function triangle (a, b, c) {
  for (const v of [ a, b, c ]) {
    if (reloadPoints) {
      points.push(v)
    }
    normals.push(v)
  }
}

function tetra(a, b, c, d, count) {
  divideTriangle(a, c, b, count)
  divideTriangle(a, c, d, count)
  divideTriangle(a, b, d, count)
  divideTriangle(b, c, d, count)
}

function divideTriangle (a, b, c, count) {
  if (count === 0) {
    triangle(a, b, c)
  } else {
    const ab = normalize(mix(a, b, .5), true)
    const ac = normalize(mix(a, c, .5), true)
    const bc = normalize(mix(b, c, .5), true)

    --count

    divideTriangle(a, ab, ac, count)
    divideTriangle(ab, b, bc, count)
    divideTriangle(bc, c, ac, count)
    divideTriangle(ab, bc, ac, count)
  }
}

function render () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  for (let i = 0; i < points.length; i+=3) {
    gl.drawArrays(gl.TRIANGLES, i, 3)
  }
}

function setupEventListeners () {
  document.querySelectorAll('input[name="shading"]').forEach(el => {
    el.onclick = event => {
      if (shading === event.target.value) return
      shading = event.target.value
      gl.uniform1i(gl.getUniformLocation(program, "enablePhong"), shading === 'phong')
      render()
    }
  })
  document.getElementById('subdivision').oninput = event => {
    document.getElementById('subdivisionIndicator').innerText = event.target.value
    NumTimesToSubdivide = parseInt(event.target.value)
    reloadPoints = true
    points = []
    normals = []
    window.requestAnimationFrame(init)
  }
  document.getElementById('scale').oninput = event => {
    document.getElementById('scaleIndicator').innerText = parseFloat(event.target.value).toFixed(2) + 'x'
    scaleRate = parseFloat(event.target.value)
    left  = bottom = -1 / scaleRate * 2
    right = ytop   =  1 / scaleRate * 2
    const projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv(
      gl.getUniformLocation(program, "projectionMatrix"),
      false,
      flatten(projectionMatrix)
    )
    window.requestAnimationFrame(render)
  }
  document.getElementById('shininess').oninput = event => {
    document.getElementById('shininessIndicator').innerText = event.target.value
    materialShininess = parseInt(event.target.value)
    gl.uniform1f (gl.getUniformLocation(program, "shininess"), materialShininess)
    window.requestAnimationFrame(render)
  }
  document.getElementById('lightDirection1').oninput = event => {
    document.getElementById('lightDirection1Indicator').innerText = event.target.value
    let val = parseInt(event.target.value)
    lightPosition1 = vec3(
      Math.sin(val * Math.PI / 180),
      Math.cos(val * Math.PI / 180),
      1.0
    )
    normals = []
    window.requestAnimationFrame(init)
  }
  document.getElementById('lightDirection2').oninput = event => {
    document.getElementById('lightDirection2Indicator').innerText = event.target.value
    let val = parseInt(event.target.value)
    lightPosition2 = vec3(
      0.0,
      Math.sin(val * Math.PI / 180),
      Math.cos(val * Math.PI / 180)
    )
    normals = []
    window.requestAnimationFrame(init)
  }
  document.getElementById('lightDirection2Toggle').onclick = event => {
    gl.uniform1i(gl.getUniformLocation(program, "enableLight2"), event.target.checked)
    render()
  }
  document.querySelectorAll('input[name="material"]').forEach(el => {
    el.onclick = lighting
  })
}

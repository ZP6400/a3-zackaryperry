let score = 0
let duration = 0
let timerInterval = null
let roundTimer = null
let isPlaying = false
let activeHole = 0
let assignedKeys = ['', '', '', '']
const keyPool = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'W', 'E', 'I', 'O']
const startSpeed = 10000


window.addEventListener('DOMContentLoaded', () => {

  const hudScore = document.querySelector('#hud-score')
  const hudTimer = document.querySelector('#hud-timer')
  const startBtn = document.querySelector('#start-btn')
  const ball = document.querySelector('#ball')
  const holes = [

    document.querySelector('#hole-0'),
    document.querySelector('#hole-1'),
    document.querySelector('#hole-2'),
    document.querySelector('#hole-3')
  ]

  const scoreForm = document.querySelector('#score-form')
  const entryId = document.querySelector('#entry-id')
  const usernameInput = document.querySelector('#username')
  const scoreInput = document.querySelector('#score')
  const durationInput = document.querySelector('#duration')
  const submitBtn = document.querySelector('#submit-btn')
  const cancelBtn = document.querySelector('#cancel-btn')
  const scoresBody = document.querySelector('#scores-body')


  loadData()

  async function loadData() {

    try {

      const response = await fetch('/data')
      const data = await response.json()
      renderTable(data)
    } 
    catch (err) {

      console.error('Failed to fetch data:', err)
    }
  }

  function renderTable(data) {

    scoresBody.innerHTML = ''
    data.forEach(item => {

      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${escapeHtml(item.username)}</td>
        <td>${item.score}</td>
        <td>${item.duration}</td>
        <td>${item.pps}</td>
        <td><strong>${item.rankTier}</strong></td>
        <td>
          <button class="btn btn-action btn-secondary" onclick="startEdit(${item.id}, '${escapeHtml(item.username)}', ${item.score}, ${item.duration})">Edit</button>
          <button class="btn btn-action btn-danger" onclick="deleteEntry(${item.id})">Delete</button>
        </td>
      `
      scoresBody.appendChild(tr)
    })
  }

  function escapeHtml(str) {

    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }


  scoreForm.onsubmit = async function(event) {

    event.preventDefault()

    const id = entryId.value
    const endpoint = id ? '/edit' : '/submit'
    const payload = {

      id: id || undefined,
      username: usernameInput.value,
      score: scoreInput.value,
      duration: durationInput.value
    }

    const response = await fetch(endpoint, {

      method: 'POST',
      body: JSON.stringify(payload)
    })

    const updatedData = await response.json()
    renderTable(updatedData)
    resetForm()
  }


  window.deleteEntry = async function(id) {

    const response = await fetch('/delete', {

      method: 'POST',
      body: JSON.stringify({ id: id })
    })
    const updatedData = await response.json()
    renderTable(updatedData)
  }

  window.startEdit = function(id, user, s, d) {

    entryId.value = id
    usernameInput.value = user
    scoreInput.value = s
    durationInput.value = d
    submitBtn.textContent = 'Update Entry'
    cancelBtn.style.display = 'inline-block'
    scoreForm.scrollIntoView({ behavior: 'smooth' })
  }

  cancelBtn.onclick = function() {

    resetForm()
  }

  function resetForm() {

    entryId.value = ''
    scoreForm.reset()
    submitBtn.textContent = 'Submit Score'
    cancelBtn.style.display = 'none'
  }


  
  startBtn.onclick = function() {

    score = 0
    duration = 0
    isPlaying = true
    hudScore.textContent = score
    hudTimer.textContent = duration
    startBtn.disabled = true

    timerInterval = setInterval(() => {

      duration++
      hudTimer.textContent = duration
    }, 1000)

    shuffleHoleKeys()
    nextHole()
  }

  function endGame() {

    isPlaying = false
    clearInterval(timerInterval)
    clearTimeout(roundTimer)

    startBtn.disabled = false
    
    ball.style.transition = 'none'
    ball.style.top = '115px'
    ball.style.left = '50%'
    holes.forEach( h => h.classList.remove( 'targeted' ) )

    scoreInput.value = score
    durationInput.value = Math.max(duration, 1)
    alert( `Game Over! The ball fell into the hole. Final Score: ${score}` )
    usernameInput.focus()
  }

  function shuffleHoleKeys() {

    const shuffled = [...keyPool].sort(() => 0.5 - Math.random())
    assignedKeys = shuffled.slice(0, 4)
    holes.forEach((hole, idx) => {

      hole.querySelector('.hole-key').textContent = assignedKeys[idx]
    })
  }

  function nextHole() {

    if (!isPlaying) return

    let pick
    do {

      pick = Math.floor(Math.random() * 4)
    } while (pick === activeHole)

    activeHole = pick
    holes.forEach((h, i) => h.classList.toggle('targeted', i === activeHole))

    const travelDurationMs = startSpeed - ( score * 10 )

    ball.style.transition = `top ${travelDurationMs / 1000}s linear, left ${travelDurationMs / 1000}s linear`

    const target = holes[ activeHole ]
    ball.style.top = `${target.offsetTop + 22}px`
    ball.style.left = `${target.offsetLeft + 22}px`

    clearTimeout( roundTimer )
    roundTimer = setTimeout( () => {

      endGame()
    }, travelDurationMs )
  }

  window.onkeydown = function(event) {

    if (!isPlaying) return
    const key = event.key.toUpperCase()
    const correctKey = assignedKeys[activeHole]

    if (key === correctKey) {

      score += 10
      hudScore.textContent = score
      shuffleHoleKeys()
      nextHole()
    }
  }
})
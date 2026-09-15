let score = 0
let duration = 0
let timerInterval = null
let roundTimer = null
let isPlaying = false
let activeHole = 0
let assignedKeys = ['', '', '', '']
const keyPool = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'W', 'E', 'I', 'O']


window.addEventListener('DOMContentLoaded', () => {

  const loggedOutView = document.querySelector('#logged-out-view')
  const loggedInView = document.querySelector('#logged-in-view')
  const mainContent = document.querySelector('#main-content')
  const currentUserDisplay = document.querySelector('#current-user-display')
  const logoutBtn = document.querySelector('#logout-btn')

  const loginForm = document.getElementById('login-form')
  const loginUsernameInput = document.getElementById('login-username')
  const loginPasswordInput = document.getElementById('login-password')

  if (loginForm) {

    loginForm.onsubmit = async (e) => {

      e.preventDefault()
      const username = loginUsernameInput.value.trim()
      const password = loginPasswordInput.value

      try {

        const res = await fetch('/api/login', {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })

        if (res.ok) {

          loginUsernameInput.value = ''
          loginPasswordInput.value = ''
          await checkAuth()
        } 
        else {

          const err = await res.json()
          alert(err.error || 'Login failed')
        }
      } 
      catch (err) {

        console.error('Login error:', err)
        alert('Network error connecting to login service')
      }
    }
  }

  checkAuth()
  async function checkAuth() {

    try {

      const res = await fetch('/api/user')
      const user = await res.json()
      if (user.username) {

        setLoggedInUI(user.username)
        loadData()
      } 
      else {

        setLoggedOutUI()
      }
    } 
    catch (err) {

      console.error('Auth check failed:', err)
    }
  }

  function setLoggedInUI(username) {

    loggedOutView.style.display = 'none'
    loggedInView.style.display = 'block'
    mainContent.style.display = 'block'
    currentUserDisplay.textContent = username
  }

  function setLoggedOutUI() {

    loggedOutView.style.display = 'block'
    loggedInView.style.display = 'none'
    mainContent.style.display = 'none'
    currentUserDisplay.textContent = ''
    scoresBody.innerHTML = ''
  }

  logoutBtn.onclick = async () => {

    await fetch('/api/logout', { method: 'POST' })
    setLoggedOutUI()
  }



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
  const scoreInput = document.querySelector('#score')
  const durationInput = document.querySelector('#duration')
  const notesInput = document.querySelector('#notes')
  const submitBtn = document.querySelector('#submit-btn')
  const cancelBtn = document.querySelector('#cancel-btn')
  const scoresBody = document.querySelector('#scores-body')

  

  async function loadData() {

    try {

      const response = await fetch('/data')
      if (!response.ok) {

        return
      }

      const data = await response.json()
      if (Array.isArray(data)) {

        renderTable(data)
      }
    } 
    catch (err) {

      console.error('Failed to fetch data:', err)
    }
  }

  function renderTable(data) {

    if (!Array.isArray(data)) {

      return
    }

    scoresBody.innerHTML = ''
    data.forEach(item => {

      const safeNotes = escapeHtml(item.notes || '').replace(/'/g, "\\'")
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${escapeHtml(item.username)}</td>
        <td>${item.score}</td>
        <td>${item.duration}</td>
        <td>${item.pps}</td>
        <td><span class="badge bg-secondary">${escapeHtml(item.difficulty || 'Normal')}</span></td>
        <td><span class="badge bg-primary">${item.rankTier}</span></td>
        <td>${escapeHtml(item.notes || '—')}</td>
        <td style="white-space: nowrap;">
          <button class="btn btn-sm btn-info me-1" onclick="startEdit('${item._id}', ${item.score}, ${item.duration}, '${item.difficulty || 'Normal'}', '${safeNotes}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEntry('${item._id}')">Delete</button>
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
    const selectedDiff = document.querySelector('input[name="difficulty"]:checked')?.value || 'Normal'

    const payload = {

      id: id || undefined,
      score: scoreInput.value,
      duration: durationInput.value,
      difficulty: selectedDiff,
      notes: notesInput.value
    }

    const response = await fetch(endpoint, {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const updatedData = await response.json()
    renderTable(updatedData)
    resetForm()
  }


  window.deleteEntry = async function(id) {

    const response = await fetch('/delete', {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    })
    const updatedData = await response.json()
    renderTable(updatedData)
  }

  window.startEdit = function(id, scoreVal, durationVal, difficultyVal, noteText) {

    entryId.value = id
    scoreInput.value = scoreVal
    durationInput.value = durationVal
    notesInput.value = (typeof noteText === 'string') ? noteText : ''

    const radio = document.querySelector(`input[name="difficulty"][value="${difficultyVal}"]`)
    if (radio) radio.checked = true

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
    notesInput.value = ''
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
    document.querySelectorAll('input[name="difficulty"]').forEach(r => r.disabled = true)

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
    document.querySelectorAll('input[name="difficulty"]').forEach(r => r.disabled = false)
    
    ball.style.transition = 'none'
    ball.style.top = '115px'
    ball.style.left = '50%'
    holes.forEach(h => h.classList.remove('targeted'))

    scoreInput.value = score
    durationInput.value = Math.max(duration, 1)
    alert(`Game Over! The ball fell into the hole. Final Score: ${score}`)
    scoreForm.scrollIntoView({ behavior: 'smooth' })
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

    const isDaredevil = document.querySelector('input[name="difficulty"]:checked')?.value === 'Daredevil'

    const startSpeed = isDaredevil ? 5000 : 10000
    const speedMultiplier = isDaredevil ? 25 : 10
    const travelDurationMs = Math.max(startSpeed - (score * speedMultiplier), 400)

    ball.style.transition = `top ${travelDurationMs / 1000}s linear, left ${travelDurationMs / 1000}s linear`

    const target = holes[activeHole]
    ball.style.top = `${target.offsetTop + 22}px`
    ball.style.left = `${target.offsetLeft + 22}px`

    clearTimeout(roundTimer)
    roundTimer = setTimeout(() => {

      endGame()
    }, travelDurationMs)
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
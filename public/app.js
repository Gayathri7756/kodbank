// Page navigation
function showRegister() {
  document.getElementById('register-page').classList.remove('hidden');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  clearMessages();
}

function showLogin() {
  document.getElementById('register-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  clearMessages();
}

function showDashboard() {
  document.getElementById('register-page').classList.add('hidden');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');
  document.getElementById('balance-display').classList.add('hidden');
}

function clearMessages() {
  document.getElementById('register-message').textContent = '';
  document.getElementById('register-message').className = 'message';
  document.getElementById('login-message').textContent = '';
  document.getElementById('login-message').className = 'message';
}

// Register form handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;

  const messageEl = document.getElementById('register-message');
  messageEl.textContent = 'Registering...';
  messageEl.className = 'message';

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, phone, password })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.textContent = data.message + ' - Redirecting to login...';
      messageEl.className = 'message success';
      setTimeout(() => {
        showLogin();
        document.getElementById('register-form').reset();
      }, 2000);
    } else {
      messageEl.textContent = data.message;
      messageEl.className = 'message error';
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Please try again.';
    messageEl.className = 'message error';
  }
});

// Login form handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const messageEl = document.getElementById('login-message');
  messageEl.textContent = 'Logging in...';
  messageEl.className = 'message';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      messageEl.textContent = 'Login successful! Redirecting...';
      messageEl.className = 'message success';
      setTimeout(() => {
        showDashboard();
        document.getElementById('login-form').reset();
      }, 1000);
    } else {
      messageEl.textContent = data.message;
      messageEl.className = 'message error';
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Please try again.';
    messageEl.className = 'message error';
  }
});

// Check balance button handler
document.getElementById('check-balance-btn').addEventListener('click', async () => {
  const button = document.getElementById('check-balance-btn');
  button.disabled = true;
  button.textContent = 'Loading...';

  try {
    const response = await fetch('/api/user/balance', {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const balanceDisplay = document.getElementById('balance-display');
      const balanceText = document.getElementById('balance-text');
      
      // Format balance with commas
      const formattedBalance = data.balance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      balanceText.textContent = `Your balance is: $${formattedBalance}`;
      balanceDisplay.classList.remove('hidden');
      
      // Trigger confetti animation
      launchConfetti();
    } else {
      alert(data.message || 'Failed to fetch balance');
      if (response.status === 401) {
        showLogin();
      }
    }
  } catch (error) {
    alert('Error fetching balance. Please try again.');
  } finally {
    button.disabled = false;
    button.innerHTML = '<span class="btn-icon">💵</span> Check Balance';
  }
});

// Logout button handler
document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    document.getElementById('balance-display').classList.add('hidden');
    showLogin();
  } catch (error) {
    alert('Error logging out');
  }
});

// Confetti animation
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const confettiPieces = [];
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'];
  
  class Confetti {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -10;
      this.size = Math.random() * 8 + 4;
      this.speedY = Math.random() * 3 + 2;
      this.speedX = Math.random() * 2 - 1;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.rotation = Math.random() * 360;
      this.rotationSpeed = Math.random() * 10 - 5;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.rotation += this.rotationSpeed;
      
      if (this.y > canvas.height) {
        return false;
      }
      return true;
    }
    
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation * Math.PI / 180);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }
  
  // Create confetti pieces
  for (let i = 0; i < 150; i++) {
    confettiPieces.push(new Confetti());
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = confettiPieces.length - 1; i >= 0; i--) {
      const piece = confettiPieces[i];
      if (piece.update()) {
        piece.draw();
      } else {
        confettiPieces.splice(i, 1);
      }
    }
    
    if (confettiPieces.length > 0) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

// Initialize app
showRegister();

// ============================================
// KODBANK - PREMIUM BANKING APPLICATION
// ============================================

// Page Navigation
function showLanding() {
  document.getElementById('landing-page').classList.remove('hidden');
  document.getElementById('register-page').classList.add('hidden');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  clearMessages();
}

function showRegister() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('register-page').classList.remove('hidden');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  clearMessages();
}

function showLogin() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('register-page').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('dashboard-page').classList.add('hidden');
  clearMessages();
}

function showDashboard() {
  document.getElementById('landing-page').classList.add('hidden');
  document.getElementById('register-page').classList.add('hidden');
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('dashboard-page').classList.remove('hidden');
  document.getElementById('balance-display').classList.add('hidden');
}

function clearMessages() {
  const messages = document.querySelectorAll('.message');
  messages.forEach(msg => {
    msg.textContent = '';
    msg.className = 'message hidden';
  });
}

// Registration Handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;

  const messageEl = document.getElementById('register-message');
  messageEl.textContent = 'Creating your account...';
  messageEl.className = 'message';
  messageEl.classList.remove('hidden');

  try {
    console.log('Attempting registration for:', username);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, phone, password })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      messageEl.textContent = '✓ ' + data.message + ' - Redirecting to login...';
      messageEl.className = 'message success';
      setTimeout(() => {
        showLogin();
        document.getElementById('register-form').reset();
      }, 2000);
    } else {
      messageEl.textContent = '✗ ' + (data.message || 'Registration failed');
      messageEl.className = 'message error';
    }
  } catch (error) {
    console.error('Registration error:', error);
    messageEl.textContent = '✗ Network error: ' + error.message;
    messageEl.className = 'message error';
  }
});

// Login Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const messageEl = document.getElementById('login-message');
  messageEl.textContent = 'Signing you in...';
  messageEl.className = 'message';
  messageEl.classList.remove('hidden');

  try {
    console.log('Attempting login for:', username);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok && data.success) {
      messageEl.textContent = '✓ Login successful! Redirecting...';
      messageEl.className = 'message success';
      
      // Update dashboard with username
      document.getElementById('dashboard-username').textContent = username;
      document.getElementById('sidebar-username').textContent = username;
      document.querySelector('.user-avatar').textContent = username.charAt(0).toUpperCase();
      
      setTimeout(() => {
        showDashboard();
        document.getElementById('login-form').reset();
      }, 1000);
    } else {
      messageEl.textContent = '✗ ' + (data.message || 'Login failed');
      messageEl.className = 'message error';
    }
  } catch (error) {
    console.error('Login error:', error);
    messageEl.textContent = '✗ Network error: ' + error.message;
    messageEl.className = 'message error';
  }
});

// Check Balance Handler
document.getElementById('check-balance-btn').addEventListener('click', async () => {
  const button = document.getElementById('check-balance-btn');
  const originalText = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/></svg> Loading...';

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
      
      // Update main balance display
      document.getElementById('balance-amount').textContent = `$${formattedBalance}`;
      
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
    console.error('Balance error:', error);
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
});

// Logout Handler
document.getElementById('logout-btn').addEventListener('click', async (e) => {
  e.preventDefault();
  
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    
    document.getElementById('balance-display').classList.add('hidden');
    showLanding();
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error logging out');
  }
});

// Confetti Animation
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const confettiPieces = [];
  const colors = ['#F5A623', '#06B6D4', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
  
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

// Initialize app - Show landing page
showLanding();

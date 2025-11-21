(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // hi-dpi support
  function fitCanvas(){
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * devicePixelRatio);
    canvas.height = Math.floor(rect.height * devicePixelRatio);
    ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // UI elements
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');
  const levelEl = document.getElementById('level');

  // Game state
  let score = 0, lives = 3, level = 1;
  let playing = false, paused = false;

  // Player
  const player = {
    w: 120,
    h: 18,
    x: 0, // will set later
    y: 0,
    speed: 8
  };

  // Stars
  const stars = [];
  let spawnTimer = 0;
  let spawnInterval = 900; // ms

  function resetGame(){
    score = 0; lives = 3; level = 1; spawnInterval = 900; stars.length = 0; playing = false; paused = false;
    updateUI();
  }

  function updateUI(){
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
  }

  // Start / pause / reset handlers
  startBtn.addEventListener('click', () => {
    if(!playing){ start(); }
  });
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? 'Davom ettir' : "To'xtat";
  });
  resetBtn.addEventListener('click', () => { resetGame(); });

  // Keyboard controls
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Mouse move -> player follow
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    player.x = Math.max(0, Math.min(rect.width - player.w, mx - player.w/2));
  });

  // Utility: random
  function rand(min,max){ return Math.random()*(max-min)+min }

  // Create star
  function spawnStar(){
    const rect = canvas.getBoundingClientRect();
    const size = rand(14,32);
    stars.push({
      x: rand(10, rect.width - 10 - size),
      y: -30,
      size,
      vy: rand(1.6 + level*0.3, 2.8 + level*0.6),
      points: Math.round(size/6)
    });
  }

  // Main loop
  let last = performance.now();
  function loop(now){
    const dt = now - last;
    last = now;
    if(!playing){ drawTitle(); requestAnimationFrame(loop); return; }
    if(paused){ drawPaused(); requestAnimationFrame(loop); return; }

    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function start(){
    playing = true; paused = false; last = performance.now(); spawnTimer = 0;
    // init player pos
    const rect = canvas.getBoundingClientRect();
    player.x = (rect.width - player.w)/2;
    player.y = rect.height - player.h - 8;
    updateUI();
  }

  function update(dt){
    const rect = canvas.getBoundingClientRect();
    // keyboard left/right
    if(keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if(keys['ArrowRight'] || keys['d']) player.x += player.speed;
    player.x = Math.max(0, Math.min(rect.width - player.w, player.x));

    // spawn stars
    spawnTimer += dt;
    if(spawnTimer > spawnInterval){ spawnTimer = 0; spawnStar(); }

    // update stars
    for(let i = stars.length-1; i>=0; i--){
      const s = stars[i];
      s.y += s.vy;
      // check collision with player
      if(s.y + s.size >= player.y && s.x + s.size > player.x && s.x < player.x + player.w){
        // caught
        score += s.points;
        stars.splice(i,1);
        // level up every 10 points
        if(score >= level*10){ level++; spawnInterval = Math.max(300, spawnInterval - 120); }
        updateUI();
        continue;
      }
      // fell below
      if(s.y > rect.height + 40){
        stars.splice(i,1);
        lives -= 1;
        updateUI();
        if(lives <= 0){ gameOver(); }
      }
    }
  }

  function gameOver(){
    playing = false;
    // show game over overlay briefly
    setTimeout(()=>{ alert('Oʻyin tugadi! Ball: ' + score); }, 50);
  }

  // Drawing functions
  function clear(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  function drawBackground(){
    const rect = canvas.getBoundingClientRect();
    // subtle stars
    ctx.fillStyle = '#071427';
    ctx.fillRect(0,0,rect.width,rect.height);
  }

  function drawPlayer(){
    ctx.save();
    // body
    ctx.fillStyle = '#2b8fd6';
    roundRect(ctx, player.x, player.y, player.w, player.h, 8, true, false);
    // stripe
    ctx.fillStyle = '#08384f';
    ctx.fillRect(player.x+8, player.y+3, player.w-16, 6);
    ctx.restore();
  }

  function drawStar(x,y,size){
    ctx.save();
    ctx.translate(x + size/2, y + size/2);
    const r = size/2;
    ctx.beginPath();
    for(let i=0;i<5;i++){
      ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*r, -Math.sin((18+i*72)/180*Math.PI)*r);
      ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*(r*0.5), -Math.sin((54+i*72)/180*Math.PI)*(r*0.5));
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.restore();
  }

  function render(){
    const rect = canvas.getBoundingClientRect();
    clear();
    // gradient bg
    const grad = ctx.createLinearGradient(0,0,0,rect.height);
    grad.addColorStop(0,'#041426'); grad.addColorStop(1,'#00121a');
    ctx.fillStyle = grad; ctx.fillRect(0,0,rect.width,rect.height);

    // draw stars
    for(const s of stars) drawStar(s.x, s.y, s.size);

    // player
    drawPlayer();

    // top-left HUD small
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(8,8,160,36);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.font = '14px system-ui'; ctx.fillText('Ball: ' + score, 16, 32);
  }

  function drawTitle(){
    const rect = canvas.getBoundingClientRect();
    clear();
    ctx.fillStyle = '#031322'; ctx.fillRect(0,0,rect.width,rect.height);
    ctx.fillStyle = '#9fd3ff'; ctx.font = '24px system-ui'; ctx.textAlign = 'center';
    ctx.fillText("Catch the Stars", rect.width/2, rect.height/2 - 10);
    ctx.font = '14px system-ui'; ctx.fillText("Boshlash uchun 'Boshlash' tugmasini bosing", rect.width/2, rect.height/2 + 18);
  }

  function drawPaused(){
    const rect = canvas.getBoundingClientRect();
    render();
    ctx.fillStyle = 'rgba(2,6,12,0.48)'; ctx.fillRect(0,0,rect.width,rect.height);
    ctx.fillStyle = '#fff'; ctx.font = '20px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Toʻxtatildi', rect.width/2, rect.height/2);
  }

  // helper: rounded rect
  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    if(typeof r === 'undefined') r=5;
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
    if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }

  // Start main loop
  requestAnimationFrame(loop);

  // expose nice reset on load
  resetGame();

})();
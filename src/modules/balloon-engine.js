import Matter from 'matter-js';
import confetti from 'canvas-confetti';

export function initBalloonEngine(wishesList, onOpenWishModalCallback, onMilestoneReached) {
  const canvas = document.getElementById('balloons-physics-canvas');
  const viewport = document.getElementById('skyViewportContainer');
  const openedCounterEl = document.getElementById('openedBalloonsCount');
  const totalCounterEl = document.getElementById('totalBalloonsCount');
  const privateNoticeBox = document.getElementById('privateNoticeBox');

  if (!canvas || !viewport) return { popById: () => {}, getOpenedWishes: () => [] };

  const { Engine, Render, Runner, Bodies, Composite, Events, Mouse, MouseConstraint, Body } = Matter;

  let width = viewport.clientWidth;
  let height = viewport.clientHeight;

  canvas.width = width;
  canvas.height = height;

  const engine = Engine.create({
    gravity: { x: 0, y: -0.03 } // Lực đẩy Archimedes nhẹ hướng lên
  });

  const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: width,
      height: height,
      wireframes: false,
      background: 'transparent'
    }
  });

  // Tường giới hạn vô hình xung quanh viewport
  const wallOpts = { isStatic: true, render: { visible: false } };
  let ceiling = Bodies.rectangle(width / 2, -50, width * 2, 100, wallOpts);
  let floor = Bodies.rectangle(width / 2, height + 60, width * 2, 100, wallOpts);
  let leftWall = Bodies.rectangle(-35, height / 2, 70, height * 2, wallOpts);
  let rightWall = Bodies.rectangle(width + 35, height / 2, 70, height * 2, wallOpts);

  Composite.add(engine.world, [ceiling, floor, leftWall, rightWall]);

  const openedSet = new Set();
  const openedWishesList = [];
  totalCounterEl.textContent = wishesList.length;

  // Bảng màu bóng bay xinh xắn tươi tắn (Sweet Rose & Warm Pastel)
  const balloonColors = [
    '#F43F5E', '#EC4899', '#FB7185', '#F59E0B', 
    '#BE123C', '#C9A66B', '#8B5CF6', '#10B981', '#38BDF8'
  ];

  // Tạo các quả bóng tròn mềm mại bay từ dưới lên
  const balloonBodies = wishesList.map((wish, index) => {
    const radius = Math.min(36, Math.max(25, width / 26));
    const x = Math.random() * (width - 120) + 60;
    // Phân tầng vị trí xuất phát để bóng bay lên theo nhịp
    const y = (height * 0.2) + (Math.random() * (height * 0.7));

    const color = wish.color || balloonColors[index % balloonColors.length];

    const body = Bodies.circle(x, y, radius, {
      restitution: 0.9,     // Nảy mềm mại khi va chạm
      frictionAir: 0.03,    // Cản không khí vừa phải để lơ lửng
      friction: 0.1,
      render: {
        fillStyle: color,
        strokeStyle: '#FFFFFF',
        lineWidth: 2
      }
    });

    body.wishData = wish;
    body.balloonRadius = radius;
    body.balloonColor = color;
    body.initialFloatSeed = Math.random() * 100;
    return body;
  });

  Composite.add(engine.world, balloonBodies);

  // Thêm tương tác chuột & cảm ứng di động
  const mouse = Mouse.create(canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });
  Composite.add(engine.world, mouseConstraint);
  render.mouse = mouse;

  // HIỆU ỨNG BAY BỒNG BỀNH (TRUE CONTINUOUS FLOATING & DRIFTING)
  // Mỗi frame, tạo lực gió sine wave nhẹ và lực nâng dao động tự nhiên
  Events.on(engine, 'beforeUpdate', (event) => {
    const time = event.timestamp * 0.002;
    const bodies = Composite.allBodies(engine.world);

    bodies.forEach(body => {
      if (body.wishData) {
        const seed = body.initialFloatSeed || 0;
        // Gió ngang thổi nhẹ dập dềnh
        const windX = Math.sin(time + seed) * 0.00012;
        // Lực nhấp nhô lên xuống như bóng khí trong nước
        const bobbingY = Math.cos(time * 1.5 + seed) * 0.00015;

        Body.applyForce(body, body.position, {
          x: windX,
          y: bobbingY
        });

        // Giữ bóng không bị kẹt ở trần
        if (body.position.y < body.balloonRadius + 20) {
          Body.applyForce(body, body.position, { x: 0, y: 0.0008 });
        }
      }
    });
  });

  // Bấm vào bóng để chọc nổ (Pop)
  Events.on(mouseConstraint, 'startdrag', (evt) => {
    const clickedBody = evt.body;
    if (clickedBody && clickedBody.wishData) {
      popBalloon(clickedBody);
    }
  });

  // Hỗ trợ cả chạm trực tiếp qua touch/click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const bodies = Composite.allBodies(engine.world);
    for (let body of bodies) {
      if (body.wishData) {
        const dist = Math.hypot(body.position.x - clickX, body.position.y - clickY);
        if (dist <= body.balloonRadius + 5) {
          popBalloon(body);
          break;
        }
      }
    }
  });

  function popBalloon(body) {
    if (!body || openedSet.has(body.wishData.id)) return;

    openedSet.add(body.wishData.id);
    openedWishesList.push(body.wishData);
    openedCounterEl.textContent = openedSet.size;

    // Tọa độ màn hình nổ pháo hoa cánh hoa & kim tuyến
    const rect = canvas.getBoundingClientRect();
    const screenX = (rect.left + body.position.x) / window.innerWidth;
    const screenY = (rect.top + body.position.y) / window.innerHeight;

    confetti({
      particleCount: 30,
      spread: 75,
      origin: { x: screenX, y: screenY },
      colors: [body.balloonColor || '#F43F5E', '#FDA4AF', '#FCD34D', '#FFFFFF', '#FECDD3']
    });

    // Xóa bóng khỏi màn chơi
    Composite.remove(engine.world, body);

    // Mở Modal xem thiệp 3D
    if (onOpenWishModalCallback) {
      onOpenWishModalCallback(body.wishData);
    }

    // Khi đã mở từ 6 bóng trở lên hoặc hết bóng -> hiện thông báo hòm thư bí mật
    if (openedSet.size >= 6 && privateNoticeBox) {
      privateNoticeBox.style.display = 'block';
    }

    if (onMilestoneReached) {
      onMilestoneReached(openedSet.size, wishesList.length);
    }
  }

  // Khởi động Runner
  const runner = Runner.create();
  Runner.run(runner, engine);
  Render.run(render);

  // VẼ BÓNG BAY ĐẸP MẮT (Highlight bóng, nơ và dây bóng uốn lượn)
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    const bodies = Composite.allBodies(engine.world);

    bodies.forEach(body => {
      if (body.wishData) {
        const x = body.position.x;
        const y = body.position.y;
        const r = body.balloonRadius;

        ctx.save();

        // 1. Dây bóng uốn lượn bên dưới
        ctx.strokeStyle = '#FDA4AF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.quadraticCurveTo(x - 5, y + r + 15, x + 3, y + r + 30);
        ctx.stroke();

        // 2. Nút thắt đuôi bóng
        ctx.fillStyle = body.balloonColor;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + r);
        ctx.lineTo(x + 4, y + r);
        ctx.lineTo(x, y + r + 6);
        ctx.closePath();
        ctx.fill();

        // 3. Ánh sáng phản chiếu bóng loáng (Gloss highlight)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Tên người gửi ngắn gọn in trên bóng
        ctx.font = '700 11px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 4;

        const sName = (body.wishData && (body.wishData.from_name || body.wishData.name || body.wishData.sender)) || 'Tech';
        const shortName = String(sName).trim().split(' ').slice(-1)[0] || '20.10';
        ctx.fillText(shortName, x, y);

        ctx.restore();
      }
    });
  });

  // Nút mở ngẫu nhiên
  const btnRandom = document.getElementById('btnRandomBalloon');
  if (btnRandom) {
    btnRandom.addEventListener('click', () => {
      const remainingBodies = Composite.allBodies(engine.world).filter(b => b.wishData);
      if (remainingBodies.length === 0) {
        alert('Chị em đã mở hết tất cả các quả bóng rồi! Hãy cùng mở hòm thư bí mật bên dưới nhé! 🌸');
        return;
      }
      const pick = remainingBodies[Math.floor(Math.random() * remainingBodies.length)];
      popBalloon(pick);
    });
  }

  // Tự động thích ứng khi resize
  window.addEventListener('resize', () => {
    width = viewport.clientWidth;
    height = viewport.clientHeight;
    canvas.width = width;
    canvas.height = height;

    Render.setPixelRatio(render, window.devicePixelRatio);
    render.options.width = width;
    render.options.height = height;

    Body.setPosition(ceiling, { x: width / 2, y: -50 });
    Body.setPosition(floor, { x: width / 2, y: height + 60 });
    Body.setPosition(rightWall, { x: width + 35, y: height / 2 });
  });

  return {
    popById: (id) => {
      const b = Composite.allBodies(engine.world).find(item => item.wishData && item.wishData.id === id);
      if (b) popBalloon(b);
    },
    getOpenedWishes: () => openedWishesList
  };
}

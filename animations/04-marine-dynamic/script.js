var RENDERER = {

  POINT_INTERVAL: 4,
  FISH_COUNT: 10,
  MAX_INTERVAL_COUNT: 160,
  INIT_HEIGHT_RATE: 0.60,
  THRESHOLD: 36,
  WATCH_INTERVAL: 200,

  /* MODEL / LOCAL FISH COUNT */

  MODEL_NODE_COUNT: 9,
  MODEL_BASE_OFFSET: 0.052,
  MODEL_LIFT_PER_FISH: 0.045,
  MODEL_MAX_LIFT: 0.225,
  MODEL_SMOOTHING: 0.075,
  MODEL_INFLUENCE_RADIUS: 0.20,

  COUNT_AXIS_MAX: 5,
  SHOW_COUNT_AXIS: true,

  /* OPTIONAL GRID */

  SHOW_GRID: false,
  GRID_DIVISIONS: 12,

  /* SUBTLE DEPTH / ISOBATHS */

  SHOW_ISOBATHS: true,
  ISOBATH_COLOR: 'rgba(185,217,232,0.10)',
  ISOBATH_LINE_WIDTH: 1.0,

  /* COLOURS */

  SEA_COLOR_TOP: '#1B6983',
  SEA_COLOR_BOTTOM: '#0E5A73',
  SEA_EDGE: '#8BC7DA',

  SKY_TOP: '#0b1320',
  SKY_BOTTOM: '#0b1320',

  GRID_COLOR: 'rgba(90,150,220,0.28)',

  MODEL_ANCHOVY_COLOR: '#B9D9E8',
  MODEL_TUNA_COLOR: '#F2C879',

  MODEL_SPECIES_WIDTH: 1.6,

  AXIS_COLOR: 'rgba(255,255,255,0.48)',
  AXIS_TEXT_COLOR: 'rgba(255,255,255,0.72)',

  init: function () {
    this.setParameters();
    this.reconstructMethods();
    this.setup();
    this.bindEvent();
    this.render();
  },

  setParameters: function () {
    this.$window = $(window);
    this.$container = $('#jsi-flying-fish-container');
    this.$canvas = $('<canvas />');
    this.context = this.$canvas.appendTo(this.$container).get(0).getContext('2d');

    this.points = [];
    this.fishes = [];
    this.watchIds = [];

    this.modelNodeY = {
      anchovy: [],
      tuna: []
    };

    /* reduced motion */
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = this.motionQuery.matches;
    this.animationFrameId = null;
  },

  reconstructMethods: function () {
    this.watchWindowSize = this.watchWindowSize.bind(this);
    this.jdugeToStopResize = this.jdugeToStopResize.bind(this);
    this.startEpicenter = this.startEpicenter.bind(this);
    this.moveEpicenter = this.moveEpicenter.bind(this);
    this.render = this.render.bind(this);
    this.handleMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
  },

  setup: function () {
    this.points.length = 0;
    this.fishes.length = 0;
    this.watchIds.length = 0;
    this.modelNodeY.anchovy.length = 0;
    this.modelNodeY.tuna.length = 0;

    this.intervalCount = this.MAX_INTERVAL_COUNT;

    this.width = this.$container.width();
    this.height = this.$container.height();
    this.fishCount = this.FISH_COUNT;

    var dpr = window.devicePixelRatio || 1;

    this.$canvas.attr({
      width: Math.round(this.width * dpr),
      height: Math.round(this.height * dpr)
    });

    this.$canvas.css({
      width: this.width + 'px',
      height: this.height + 'px'
    });

    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.reverse = false;

    /* 8 anchovies + 2 tuna */
    for (var i = 0; i < 8; i++) {
      this.fishes.push(new FISH(this, 'anchovy'));
    }

    for (var j = 0; j < 2; j++) {
      this.fishes.push(new FISH(this, 'tuna'));
    }

    this.createSurfacePoints();

    if (this.reducedMotion) {
      this.layoutStaticFish();
    }
  },

  createSurfacePoints: function () {
    var count = Math.max(2, Math.round(this.width / this.POINT_INTERVAL));

    this.pointInterval = this.width / (count - 1);

    this.points.push(new SURFACE_POINT(this, 0));

    for (var i = 1; i < count; i++) {
      var point = new SURFACE_POINT(this, i * this.pointInterval);
      var previous = this.points[i - 1];

      point.setPreviousPoint(previous);
      previous.setNextPoint(point);

      this.points.push(point);
    }
  },

  watchWindowSize: function () {
    this.clearTimer();

    this.tmpWidth = this.$window.width();
    this.tmpHeight = this.$window.height();

    this.watchIds.push(
      setTimeout(this.jdugeToStopResize, this.WATCH_INTERVAL)
    );
  },

  clearTimer: function () {
    while (this.watchIds.length > 0) {
      clearTimeout(this.watchIds.pop());
    }
  },

  jdugeToStopResize: function () {
    var width = this.$window.width();
    var height = this.$window.height();

    var stopped = width === this.tmpWidth && height === this.tmpHeight;

    this.tmpWidth = width;
    this.tmpHeight = height;

    if (stopped) {

  if (this.animationFrameId) {
    cancelAnimationFrame(
      this.animationFrameId
    );

    this.animationFrameId = null;
  }

  this.setup();
  this.render();
}
  },

  bindEvent: function () {
    this.$window.on('resize', this.watchWindowSize);

    this.$container.on('mouseenter', this.startEpicenter);
    this.$container.on('mousemove', this.moveEpicenter);

    if (this.motionQuery.addEventListener) {
      this.motionQuery.addEventListener('change', this.handleMotionPreferenceChange);
    } else if (this.motionQuery.addListener) {
      this.motionQuery.addListener(this.handleMotionPreferenceChange);
    }
  },

  handleMotionPreferenceChange: function (event) {
    this.reducedMotion = event.matches;

    if (this.reducedMotion && this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.setup();
    this.render();
  },

  layoutStaticFish: function () {
    /* deeper distribution so bottom third is not empty */

    var anchovyLayout = [
      [0.22, 0.52,  1],
      [0.33, 0.57, -1],
      [0.47, 0.50,  1],
      [0.61, 0.56, -1],
      [0.74, 0.51,  1],
      [0.29, 0.70, -1],
      [0.50, 0.75,  1],
      [0.70, 0.79, -1]
    ];

    var tunaLayout = [
      [0.33, 0.84,  1],
      [0.67, 0.82, -1]
    ];

    var anchovyIndex = 0;
    var tunaIndex = 0;

    for (var i = 0; i < this.fishes.length; i++) {
      var fish = this.fishes[i];
      var position;

      if (fish.species === 'anchovy') {
        position = anchovyLayout[anchovyIndex % anchovyLayout.length];
        anchovyIndex++;
      } else {
        position = tunaLayout[tunaIndex % tunaLayout.length];
        tunaIndex++;
      }

      fish.x = this.width * position[0];
      fish.y = this.height * position[1];
      fish.previousY = fish.y;
      fish.vx = position[2];
      fish.vy = 0;
      fish.ay = 0;
      fish.direction = position[2] < 0;
      fish.isOut = false;
    }
  },

  getAxis: function (event) {
    var offset = this.$container.offset();

    return {
      x: event.clientX - offset.left + this.$window.scrollLeft(),
      y: event.clientY - offset.top + this.$window.scrollTop()
    };
  },

  startEpicenter: function (event) {
    this.axis = this.getAxis(event);
  },

  moveEpicenter: function (event) {
    if (this.reducedMotion) {
      return;
    }

    var axis = this.getAxis(event);

    if (!this.axis) {
      this.axis = axis;
    }

    this.generateEpicenter(axis.x, axis.y, axis.y - this.axis.y);
    this.axis = axis;
  },

  getNominalSeaY: function () {
    return this.height * (1 - this.INIT_HEIGHT_RATE);
  },

  getSurfaceYAtX: function (x) {
    if (!this.points.length) {
      return this.getNominalSeaY();
    }

    var index = Math.round(x / this.pointInterval);

    index = Math.max(0, Math.min(this.points.length - 1, index));

    return this.height - this.points[index].height;
  },

  generateEpicenter: function (x, y, velocity) {
    var waterY = this.getNominalSeaY();

    if (y < waterY - this.THRESHOLD || y > waterY + this.THRESHOLD) {
      return;
    }

    var index = Math.round(x / this.pointInterval);

    if (index < 0 || index >= this.points.length) {
      return;
    }

    this.points[index].interfere(y, velocity);
  },

  controlStatus: function () {
    for (var i = 0; i < this.points.length; i++) {
      this.points[i].updateSelf();
    }

    for (var j = 0; j < this.points.length; j++) {
      this.points[j].updateNeighbors();
    }

    if (this.fishes.length < this.fishCount && --this.intervalCount === 0) {
      this.intervalCount = this.MAX_INTERVAL_COUNT;
      this.fishes.push(new FISH(this));
    }
  },

  drawSky: function () {
    var ctx = this.context;
    var gradient = ctx.createLinearGradient(0, 0, 0, this.height);

    gradient.addColorStop(0, this.SKY_TOP);
    gradient.addColorStop(1, this.SKY_BOTTOM);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  },

  drawSea: function () {
    var ctx = this.context;

    ctx.save();
    ctx.beginPath();

    ctx.moveTo(
      0,
      this.reverse ? 0 : this.height
    );

    for (var i = 0; i < this.points.length; i++) {
      this.points[i].render(ctx);
    }

    ctx.lineTo(
      this.width,
      this.reverse ? 0 : this.height
    );

    ctx.closePath();

    var seaGradient = ctx.createLinearGradient(
      0,
      this.height * 0.40,
      0,
      this.height
    );

    seaGradient.addColorStop(0, this.SEA_COLOR_TOP);
    seaGradient.addColorStop(1, this.SEA_COLOR_BOTTOM);

    ctx.fillStyle = seaGradient;
    ctx.fill();

    ctx.restore();
  },

  buildSeaClipPath: function () {
    var ctx = this.context;

    ctx.beginPath();
    ctx.moveTo(0, this.height);

    for (var i = 0; i < this.points.length; i++) {
      ctx.lineTo(
        this.points[i].x,
        this.height - this.points[i].height
      );
    }

    ctx.lineTo(this.width, this.height);
    ctx.closePath();
  },

  drawSeaGrid: function () {
    if (!this.SHOW_GRID) {
      return;
    }

    var ctx = this.context;
    var step = this.width / this.GRID_DIVISIONS;

    ctx.save();
    this.buildSeaClipPath();
    ctx.clip();

    ctx.strokeStyle = this.GRID_COLOR;
    ctx.lineWidth = 0.7;

    for (var x = 0; x <= this.width + 0.1; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (var y = 0; y <= this.height + 0.1; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    ctx.restore();
  },

  drawIsobaths: function () {
    if (!this.SHOW_ISOBATHS) {
      return;
    }

    var ctx = this.context;

    ctx.save();
    this.buildSeaClipPath();
    ctx.clip();

    ctx.strokeStyle = this.ISOBATH_COLOR;
    ctx.lineWidth = this.ISOBATH_LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    var w = this.width;
    var h = this.height;

    /* line 1 */
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.76);
    ctx.bezierCurveTo(
      w * 0.18, h * 0.73,
      w * 0.34, h * 0.79,
      w * 0.48, h * 0.76
    );
    ctx.bezierCurveTo(
      w * 0.62, h * 0.73,
      w * 0.78, h * 0.79,
      w * 0.94, h * 0.75
    );
    ctx.stroke();

    /* line 2 */
    ctx.beginPath();
    ctx.moveTo(w * 0.10, h * 0.85);
    ctx.bezierCurveTo(
      w * 0.24, h * 0.82,
      w * 0.38, h * 0.88,
      w * 0.52, h * 0.84
    );
    ctx.bezierCurveTo(
      w * 0.66, h * 0.80,
      w * 0.80, h * 0.88,
      w * 0.92, h * 0.84
    );
    ctx.stroke();

    /* line 3 */
    ctx.beginPath();
    ctx.moveTo(w * 0.08, h * 0.93);
    ctx.bezierCurveTo(
      w * 0.21, h * 0.90,
      w * 0.37, h * 0.96,
      w * 0.50, h * 0.92
    );
    ctx.bezierCurveTo(
      w * 0.64, h * 0.88,
      w * 0.79, h * 0.96,
      w * 0.93, h * 0.91
    );
    ctx.stroke();

    ctx.restore();
  },

  drawCountAxis: function (
    curveBaseY,
    liftPerUnit,
    leftX,
    rightX
  ) {
    if (!this.SHOW_COUNT_AXIS) {
      return;
    }

    var ctx = this.context;
    var maxCount = this.COUNT_AXIS_MAX;
    var topY = curveBaseY - maxCount * liftPerUnit;
    var axisX = this.width * 0.205;
    var tickLength = this.width * 0.010;

    ctx.save();

    ctx.strokeStyle = this.AXIS_COLOR;
    ctx.fillStyle = this.AXIS_TEXT_COLOR;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(axisX, curveBaseY);
    ctx.lineTo(axisX, topY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(axisX, curveBaseY);
    ctx.lineTo(rightX, curveBaseY);
    ctx.stroke();

    for (var n = 0; n <= maxCount; n++) {
      var y = curveBaseY - n * liftPerUnit;

      ctx.beginPath();
      ctx.moveTo(axisX - tickLength, y);
      ctx.lineTo(axisX, y);
      ctx.stroke();
    }

    ctx.font =
      'italic ' +
      Math.max(10, Math.round(this.width * 0.018)) +
      'px Georgia';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillText(
      'n(x)',
      axisX + this.width * 0.012,
      topY + this.height * 0.010
    );

    ctx.restore();
  },

  getModelTargetSeries: function (
    xs,
    species,
    curveBaseY,
    liftPerUnit,
    minimumCurveY,
    influenceRadius
  ) {
    var targetY = [];

    for (var i = 0; i < xs.length; i++) {
      targetY[i] = curveBaseY;
    }

    for (var ni = 1; ni < xs.length - 1; ni++) {
      var abundance = 0;

      for (var f = 0; f < this.fishes.length; f++) {
        var fish = this.fishes[f];

        if (fish.x < 0 || fish.x > this.width) {
          continue;
        }

        var localSeaY = this.getSurfaceYAtX(fish.x);

        if (fish.y < localSeaY) {
          continue;
        }

        if (fish.species !== species) {
          continue;
        }

        var distance = Math.abs(fish.x - xs[ni]);

        if (distance > influenceRadius) {
          continue;
        }

        var weight = 1 - distance / influenceRadius;
        abundance += weight;
      }

      var target = curveBaseY - abundance * liftPerUnit;

      targetY[ni] = Math.max(target, minimumCurveY);
    }

    return targetY;
  },

  updateModelSeries: function (
    name,
    targetY,
    curveBaseY
  ) {
    var series = this.modelNodeY[name];
    var count = targetY.length;

    if (series.length !== count) {
      series.length = 0;

      for (var i = 0; i < count; i++) {
        series[i] = curveBaseY;
      }
    }

    series[0] = curveBaseY;
    series[count - 1] = curveBaseY;

    for (var j = 1; j < count - 1; j++) {
      series[j] += (targetY[j] - series[j]) * this.MODEL_SMOOTHING;
    }
  },

  buildModelPoints: function (
    xs,
    ys
  ) {
    var points = [];

    for (var i = 0; i < xs.length; i++) {
      points.push({
        x: xs[i],
        y: ys[i]
      });
    }

    return points;
  },

  drawSmoothCurve: function (
    points,
    color,
    width,
    dash
  ) {
    var ctx = this.context;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length - 1; i++) {
      var xc = (points[i].x + points[i + 1].x) / 2;
      var yc = (points[i].y + points[i + 1].y) / 2;

      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    ctx.quadraticCurveTo(
      points[points.length - 2].x,
      points[points.length - 2].y,
      points[points.length - 1].x,
      points[points.length - 1].y
    );

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(dash || []);
    ctx.stroke();

    ctx.restore();
  },

  drawModel: function () {
    var nodeCount = this.MODEL_NODE_COUNT;
    var nominalSeaY = this.getNominalSeaY();

    var leftX = this.width * 0.235;
    var rightX = this.width * 0.885;

    var xs = [];

    for (var i = 0; i < nodeCount; i++) {
      xs.push(
        leftX +
        (rightX - leftX) *
        (i / (nodeCount - 1))
      );
    }

    var curveBaseY =
      nominalSeaY -
      this.height * this.MODEL_BASE_OFFSET;

    var liftPerUnit =
      this.height * this.MODEL_LIFT_PER_FISH;

    var minimumCurveY =
      curveBaseY -
      this.height * this.MODEL_MAX_LIFT;

    var influenceRadius =
      this.width * this.MODEL_INFLUENCE_RADIUS;

    this.drawCountAxis(
      curveBaseY,
      liftPerUnit,
      leftX,
      rightX
    );

    var anchovyTarget = this.getModelTargetSeries(
      xs,
      'anchovy',
      curveBaseY,
      liftPerUnit,
      minimumCurveY,
      influenceRadius
    );

    var tunaTarget = this.getModelTargetSeries(
      xs,
      'tuna',
      curveBaseY,
      liftPerUnit,
      minimumCurveY,
      influenceRadius
    );

    this.updateModelSeries('anchovy', anchovyTarget, curveBaseY);
    this.updateModelSeries('tuna', tunaTarget, curveBaseY);

    var anchovyPoints = this.buildModelPoints(xs, this.modelNodeY.anchovy);
    var tunaPoints = this.buildModelPoints(xs, this.modelNodeY.tuna);

    this.drawSmoothCurve(
      anchovyPoints,
      this.MODEL_ANCHOVY_COLOR,
      1.8,
      []
    );

    this.drawSmoothCurve(
      tunaPoints,
      this.MODEL_TUNA_COLOR,
      1.7,
      [5, 4]
    );
  },

  drawWaterline: function () {
    var ctx = this.context;

    if (!this.points.length) {
      return;
    }

    ctx.save();
    ctx.beginPath();

    ctx.moveTo(
      this.points[0].x,
      this.height - this.points[0].height
    );

    for (var i = 1; i < this.points.length; i++) {
      ctx.lineTo(
        this.points[i].x,
        this.height - this.points[i].height
      );
    }

    ctx.strokeStyle = this.SEA_EDGE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  },

  render: function () {
    if (!this.reducedMotion) {
      this.animationFrameId = requestAnimationFrame(this.render);
    } else {
      this.animationFrameId = null;
    }

    if (!this.reducedMotion) {
      this.controlStatus();
    }

    this.context.clearRect(0, 0, this.width, this.height);

    this.drawSky();
    this.drawSea();
    this.drawSeaGrid();
    this.drawIsobaths();
    this.drawModel();

    for (var i = 0; i < this.fishes.length; i++) {
      this.fishes[i].render(this.context, this.reducedMotion);
    }

    this.drawWaterline();
  }
};



/* =========================================================
   WATER SURFACE
========================================================= */

var SURFACE_POINT = function (
  renderer,
  x
) {
  this.renderer = renderer;
  this.x = x;
  this.init();
};

SURFACE_POINT.prototype = {

  SPRING_CONSTANT: 0.018,
  SPRING_FRICTION: 0.90,
  WAVE_SPREAD: 0.22,
  ACCELARATION_RATE: 0.006,

  init: function () {
    this.initHeight =
      this.renderer.height *
      this.renderer.INIT_HEIGHT_RATE;

    this.height = this.initHeight;
    this.fy = 0;

    this.force = {
      previous: 0,
      next: 0
    };
  },

  setPreviousPoint: function (previous) {
    this.previous = previous;
  },

  setNextPoint: function (next) {
    this.next = next;
  },

  interfere: function (
    y,
    velocity
  ) {
    this.fy =
      this.renderer.height *
      this.ACCELARATION_RATE *
      (
        (
          this.renderer.height -
          this.height -
          y
        ) >= 0 ? -1 : 1
      ) *
      Math.abs(velocity);
  },

  updateSelf: function () {
    this.fy +=
      this.SPRING_CONSTANT *
      (this.initHeight - this.height);

    this.fy *= this.SPRING_FRICTION;
    this.height += this.fy;
  },

  updateNeighbors: function () {
    if (this.previous) {
      this.force.previous =
        this.WAVE_SPREAD *
        (this.height - this.previous.height);
    }

    if (this.next) {
      this.force.next =
        this.WAVE_SPREAD *
        (this.height - this.next.height);
    }
  },

  render: function (context) {
    if (this.previous) {
      this.previous.height += this.force.previous;
      this.previous.fy += this.force.previous;
    }

    if (this.next) {
      this.next.height += this.force.next;
      this.next.fy += this.force.next;
    }

    context.lineTo(
      this.x,
      this.renderer.height - this.height
    );
  }
};



/* =========================================================
   FISH
========================================================= */

var FISH = function (
  renderer,
  species
) {
  this.renderer = renderer;
  this.species = species || null;
  this.init();
};

FISH.prototype = {

  GRAVITY: 0.20,

  init: function () {
    if (!this.species) {
      this.species = Math.random() < 0.5 ? 'anchovy' : 'tuna';
    }

    this.direction = Math.random() < 0.5;

    this.x =
      this.direction
        ? (this.renderer.width + this.renderer.THRESHOLD)
        : -this.renderer.THRESHOLD;

    this.previousY = this.y;

    this.vx =
      this.getRandomValue(0.75, 1.45) *
      (this.direction ? -1 : 1);

    if (this.species === 'anchovy') {
      this.size = this.getRandomValue(0.50, 0.68);
      this.color = '#B5C7CE';
    } else {
      this.size = this.getRandomValue(0.92, 1.10);
      this.color = '#8798A2';
    }

    /* better vertical occupation */
    if (this.renderer.reverse) {

      if (this.species === 'anchovy') {
        if (Math.random() < 0.65) {
          this.y = this.getRandomValue(
            this.renderer.height * 0.34,
            this.renderer.height * 0.50
          );
        } else {
          this.y = this.getRandomValue(
            this.renderer.height * 0.58,
            this.renderer.height * 0.80
          );
        }

        this.vy = this.getRandomValue(0.20, 0.45);
        this.ay = this.getRandomValue(0.002, 0.006);
      } else {
        if (Math.random() < 0.50) {
          this.y = this.getRandomValue(
            this.renderer.height * 0.46,
            this.renderer.height * 0.64
          );
        } else {
          this.y = this.getRandomValue(
            this.renderer.height * 0.66,
            this.renderer.height * 0.86
          );
        }

        this.vy = this.getRandomValue(0.20, 0.42);
        this.ay = this.getRandomValue(0.002, 0.006);
      }

    } else {

      if (this.species === 'anchovy') {
        if (Math.random() < 0.65) {
          this.y = this.getRandomValue(
            this.renderer.height * 0.56,
            this.renderer.height * 0.72
          );
        } else {
          this.y = this.getRandomValue(
            this.renderer.height * 0.72,
            this.renderer.height * 0.88
          );
        }

        this.vy = this.getRandomValue(-0.45, -0.20);
        this.ay = this.getRandomValue(-0.006, -0.002);
      } else {
        if (Math.random() < 0.50) {
          this.y = this.getRandomValue(
            this.renderer.height * 0.60,
            this.renderer.height * 0.78
          );
        } else {
          this.y = this.getRandomValue(
            this.renderer.height * 0.74,
            this.renderer.height * 0.90
          );
        }

        this.vy = this.getRandomValue(-0.40, -0.18);
        this.ay = this.getRandomValue(-0.006, -0.002);
      }
    }

    this.isOut = false;
    this.theta = 0;
    this.phi = 0;
  },

  getRandomValue: function (
    min,
    max
  ) {
    return min + (max - min) * Math.random();
  },

  controlStatus: function () {
    this.previousY = this.y;

    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.ay;

    var waterY = this.renderer.getNominalSeaY();

    if (this.renderer.reverse) {
      if (this.y > waterY) {
        this.vy -= this.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = this.getRandomValue(0.004, 0.012);
        }
        this.isOut = false;
      }
    } else {
      if (this.y < waterY) {
        this.vy += this.GRAVITY;
        this.isOut = true;
      } else {
        if (this.isOut) {
          this.ay = this.getRandomValue(-0.012, -0.004);
        }
        this.isOut = false;
      }
    }

    if (!this.isOut) {
      this.theta += Math.PI / 55;
      this.theta %= Math.PI * 2;

      this.phi += Math.PI / 52;
      this.phi %= Math.PI * 2;
    }

    this.renderer.generateEpicenter(
      this.x + (this.direction ? -1 : 1) * this.renderer.THRESHOLD,
      this.y,
      (this.y - this.previousY) * 0.30
    );

    if (
      (this.vx > 0 && this.x > this.renderer.width + this.renderer.THRESHOLD) ||
      (this.vx < 0 && this.x < -this.renderer.THRESHOLD)
    ) {
      this.init();
    }
  },

  drawAnchovyShape: function (
    context,
    fillColor
  ) {
    context.fillStyle = fillColor;

    context.save();
    context.translate(31, 0);
    context.scale(0.97 + 0.05 * Math.sin(this.theta), 1);

    context.beginPath();
    context.moveTo(0, -2);
    context.quadraticCurveTo(7, -5, 15, -11);
    context.quadraticCurveTo(12, -4, 8, 0);
    context.quadraticCurveTo(12, 4, 15, 11);
    context.quadraticCurveTo(7, 5, 0, 2);
    context.closePath();
    context.fill();
    context.restore();

    context.beginPath();
    context.moveTo(-2, -8);
    context.quadraticCurveTo(5, -16, 12, -18);
    context.quadraticCurveTo(10, -10, 5, -7);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(14, 5);
    context.quadraticCurveTo(20, 10, 25, 11);
    context.quadraticCurveTo(22, 6, 17, 4);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(-9, 2);
    context.quadraticCurveTo(-1, 7, 7, 7);
    context.quadraticCurveTo(2, 3, -9, 2);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(-27, 0);
    context.quadraticCurveTo(-27, -5, -21, -8);
    context.bezierCurveTo(-10, -10, 5, -10, 22, -5);
    context.quadraticCurveTo(28, -3, 31, -1.7);
    context.quadraticCurveTo(32, 0, 31, 1.7);
    context.quadraticCurveTo(28, 3, 22, 5);
    context.bezierCurveTo(5, 9, -10, 9, -21, 8);
    context.quadraticCurveTo(-27, 5, -27, 0);
    context.closePath();
    context.fill();
  },

  drawTunaShape: function (
    context,
    fillColor
  ) {
    context.fillStyle = fillColor;

    context.save();
    context.translate(41, 0);
    context.scale(0.95 + 0.06 * Math.sin(this.theta), 1);

    context.beginPath();
    context.moveTo(0, -2.5);
    context.quadraticCurveTo(8, -6, 18, -16);
    context.quadraticCurveTo(14, -6, 9, 0);
    context.quadraticCurveTo(14, 6, 18, 16);
    context.quadraticCurveTo(8, 6, 0, 2.5);
    context.closePath();
    context.fill();
    context.restore();

    context.beginPath();
    context.moveTo(-3, -10);
    context.quadraticCurveTo(5, -25, 15, -28);
    context.quadraticCurveTo(14, -15, 7, -8);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(19, -7);
    context.quadraticCurveTo(27, -14, 34, -15);
    context.quadraticCurveTo(31, -8, 25, -5);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(18, 7);
    context.quadraticCurveTo(26, 14, 33, 15);
    context.quadraticCurveTo(30, 8, 24, 5);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(-8, 3);
    context.quadraticCurveTo(1, 10, 11, 9);
    context.quadraticCurveTo(4, 4, -8, 3);
    context.closePath();
    context.fill();

    context.beginPath();
    context.moveTo(-30, 0);
    context.quadraticCurveTo(-31, -7, -23, -12);
    context.bezierCurveTo(-9, -18, 13, -18, 31, -9);
    context.quadraticCurveTo(39, -5, 41, -2);
    context.quadraticCurveTo(42, 0, 41, 2);
    context.quadraticCurveTo(39, 5, 31, 9);
    context.bezierCurveTo(13, 17, -9, 18, -23, 12);
    context.quadraticCurveTo(-31, 7, -30, 0);
    context.closePath();
    context.fill();
  },

  drawShape: function (
    context,
    fillColor
  ) {
    if (this.species === 'anchovy') {
      this.drawAnchovyShape(context, fillColor);
    } else {
      this.drawTunaShape(context, fillColor);
    }
  },

  render: function (
    context,
    staticMode
  ) {
    context.save();

    context.translate(this.x, this.y);

    context.rotate(
      Math.PI +
      Math.atan2(this.vy, this.vx)
    );

    context.scale(
      this.size,
      this.size * (this.direction ? 1 : -1)
    );

    this.drawShape(context, this.color);

    context.restore();

    if (!staticMode) {
      this.controlStatus();
    }
  }
};



/* =========================================================
   START
========================================================= */

$(function () {
  RENDERER.init();
});
